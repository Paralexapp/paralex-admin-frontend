import axios from "axios";
import { ADMIN_LOGIN_URL, BASE_URL } from "../utils/constants";
import { getAdminToken, logoutAdmin } from "./authHelper";

const timeoutTime = 30 * 1000; // 30 seconds

// The backend currently ignores paging params and returns its first 100 records; ask for a
// generous page so every list keeps working once it honours them. Pages are 0-based there.
const LIST_PAGE_SIZE = 1000;

// Configure admin baseUrl for all requests
const adminApi = axios.create({
    baseURL: BASE_URL,
    timeout: timeoutTime,
});

// Admin - Request interceptor for adding (admin) token
adminApi.interceptors.request.use((config) => {
    const adminToken = getAdminToken();
    if (adminToken) {
        config.headers['Authorization'] = `Bearer ${adminToken}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Admin - Response interceptor for handling (admin) token expiry
adminApi.interceptors.response.use(
    (response) => response,
    (error) => {
        // A failed login is also a 401/403; only treat it as an expired session elsewhere.
        const isLoginRequest = error.config?.url?.includes("admin/login");
        if (error.response?.status === 401 && !isLoginRequest) {
            logoutAdmin();
            window.location.href = `${ADMIN_LOGIN_URL}?message=admin-session-expired`;
        }
        return Promise.reject(error);
    }
)

/** handleAdminRequest - to handle every admin related api request */
const handleAdminRequest = async (method, url, data = null, params = undefined) => {
    try {
        const response = await adminApi({ method, url, data, params });
        return response.data;
    } catch (error) {
        handleRequestError(error);
    }
}

/** adminRequest - shared request helper for other API modules (e.g. api/records.js) */
export const adminRequest = (method, url, data = null, params = undefined) => handleAdminRequest(method, url, data, params);

/** handleRequestError - Generic error handler for request handler functions */
const handleRequestError = (error) => {
    // If any API error (from backend api)
    if (error.response) {
        const body = error.response.data;
        throw {
            success: false,
            status: error.response.status || 400,
            error: body?.error || body?.message || (typeof body === "string" && body) || "An error occurred",
            errors: body?.errors || []
        }
    } else if (error.code === "ECONNABORTED") {
        const message = "Request Timed out. Please try again later.";
        throw { success: false, error: message, errors: [message] }
    } else {
        throw { success: false, error: "Something went wrong. Please try again later!" }
    }
}

// === LIST OF ALL API ENDPOINTS  === //

/** handleAdminLogin - API request handler function that handles admin login */
export const handleAdminLogin = async (formData) => {
    return handleAdminRequest('POST', 'admin/login', formData);
}

/** Admin Get Users - returns every non-admin user (not paginated by the backend) */
export const adminGetUsers = async () => {
    return handleAdminRequest('GET', 'admin/get-all-users')
}

/** Admin Get Lawyers - NewOkResponse envelope; the list is in `.data` */
export const adminGetLawyers = async () => {
    return handleAdminRequest('GET', 'admin/get-all-lawyers-profile', null, { pageNumber: 0, pageSize: LIST_PAGE_SIZE })
}

/** Admin add Lawyers */
export const adminAddLawyer = async (formData) => {
    return handleAdminRequest('POST', 'admin/create-lawyer-profile', formData);
}

/** Admin Get Bailbond */
export const adminGetBailBonds = async () => {
    return handleAdminRequest('GET', 'admin/get-bail-bond-requests', null, { pageNumber: 0, pageSize: LIST_PAGE_SIZE })
}

/** Admin Get All Admins */
export const adminGetAllAdmins = async () => {
    return handleAdminRequest('GET', 'admin/get-all-admins')
}

/** Admin Get Notifications */
export const adminGetNotifications = async () => {
    return handleAdminRequest('GET', 'admin/get-admin-notification')
}

/** handleAdminAddNews */
export const handleAdminAddNews = async (formData) => {
    return handleAdminRequest('POST', 'api/news/post', formData);
}

/** Admin Get Lawyer by User Id */
export const adminGetLawyerByUserId = async (userId) => {
    return handleAdminRequest('GET', 'admin/get-lawyer-by-userId', null, { userId })
}

/** Admin Get User by User Id */
export const adminGetUserByUserId = async (userId) => {
    return handleAdminRequest('GET', `api/v1/auth/get-user-by-id/${encodeURIComponent(userId)}`)
}

/** Admin Update User Profile - body is the backend's UpdateProfileDto */
export const adminUpdateUserProfile = async (formData) => {
    return handleAdminRequest('PUT', 'admin/update-user-profile', formData);
}

/** Admin Block User */
export const adminBlockUser = async (userId) => {
    return handleAdminRequest('POST', 'admin/block', null, { userId });
}

/** Admin Delete User */
export const adminDeleteUser = async (userId) => {
    return handleAdminRequest('POST', 'admin/delete-user', null, { userId });
}

/** Approve a bail bond - the backend also sends the applicant a Paystack payment link */
export const adminApproveBailBond = async (id) => {
    return handleAdminRequest('POST', `bail-bond/approve/${encodeURIComponent(id)}`);
}

/** Reject a bail bond - the backend notifies the applicant */
export const adminRejectBailBond = async (id) => {
    return handleAdminRequest('POST', `bail-bond/reject/${encodeURIComponent(id)}`);
}

// Several list endpoints filter by a created-at range; ask for everything up to tomorrow.
const ALL_TIME_START = '2020-01-01T00:00:00';
const tomorrow = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** News - every published item (not paginated) */
export const adminGetNews = async () => {
    return handleAdminRequest('GET', 'api/news/get-all');
}

/** Publish news - the backend also notifies every app user */
export const adminPostNews = async (news) => {
    return handleAdminRequest('POST', 'api/news/post', news);
}

/** Driver (rider) profiles; the trailing slash in the path is required */
export const adminGetDrivers = async () => {
    return handleAdminRequest('GET', 'service-provider/driver/profile/', null, {
        startDate: ALL_TIME_START, endDate: `${tomorrow()}T00:00:00`, pageNumber: 0, pageSize: LIST_PAGE_SIZE,
    });
}

/** Enable / disable a rider (controls whether they can be matched to deliveries) */
export const adminEnableRider = async (userId) => {
    return handleAdminRequest('PUT', 'admin/enable-rider', null, { userId });
}
export const adminDisableRider = async (userId) => {
    return handleAdminRequest('PUT', 'admin/disable-rider', null, { userId });
}

/** Delivery requests; the trailing slash in the path is required */
export const adminGetDeliveries = async () => {
    return handleAdminRequest('GET', 'delivery/request/', null, { pageNumber: 0, pageSize: LIST_PAGE_SIZE });
}

/** Assign a delivery request to a rider's driver profile */
export const adminAssignDelivery = async ({ deliveryRequestId, driverProfileId }) => {
    return handleAdminRequest('POST', 'delivery/request/assign', { deliveryRequestId, driverProfileId });
}

/** Payment records across the platform */
export const adminGetPayments = async () => {
    return handleAdminRequest('GET', 'payment/history', null, { pageNumber: 0, pageSize: LIST_PAGE_SIZE });
}

/** Legal transaction requests submitted by users; dates are plain YYYY-MM-DD */
export const adminGetTransactionRequests = async () => {
    return handleAdminRequest('GET', 'transaction/request/', null, { start: '2020-01-01', end: tomorrow() });
}

/** Create an admin. NB: if the email already belongs to an admin, the backend silently updates that account's name instead. */
export const adminCreateAdmin = async (admin) => {
    return handleAdminRequest('POST', 'admin/create-admin', admin);
}

/** Unblock a user (reverses admin/block) */
export const adminUnblockUser = async (userId) => {
    return handleAdminRequest('POST', 'admin/unblock', null, { userId });
}

/**
 * Onboard a rider: creates (or finds) their account from the email/phone, then their driver
 * profile, Paystack customer and wallet. Admin only; the trailing slash is required.
 */
export const adminCreateDriver = async (driver) => {
    return handleAdminRequest('POST', 'service-provider/driver/profile/', driver);
}
