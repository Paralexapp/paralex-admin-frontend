// src/api/authHelper.js

const TOKEN_KEY = "adminToken";

// "Remember me" keeps the session in localStorage; otherwise it lives in sessionStorage and ends
// when the browser closes. Reads check both.
const stores = () => [window.localStorage, window.sessionStorage];

export const setWithExpiry = (key, value, expiryInMilliSeconds, storage = localStorage) => {
    const item = {
        value,
        expiry: Date.now() + expiryInMilliSeconds
    };
    storage.setItem(key, JSON.stringify(item));
};

export const getWithExpiry = (key) => {
    for (const storage of stores()) {
        const itemStr = storage.getItem(key);
        if (!itemStr) continue;

        let item;
        try {
            item = JSON.parse(itemStr);
        } catch {
            storage.removeItem(key);
            continue;
        }

        //If the item is expired, delete it
        if (Date.now() > item.expiry) {
            storage.removeItem(key);
            continue;
        }

        return item.value;
    }
    return null;
}

/** decodeToken - the JWT payload, or null if it can't be read */
const decodeToken = (token) => {
    try {
        return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    } catch {
        return null;
    }
}

/** getTokenLifetime - milliseconds until the JWT's own `exp` claim, or null if unreadable */
const getTokenLifetime = (token) => {
    const payload = decodeToken(token);
    return payload?.exp ? payload.exp * 1000 - Date.now() : null;
}

export const getAdminToken = () => getWithExpiry(TOKEN_KEY);

export const setAdminToken = (token, remember = true) => {
    logoutAdmin();
    // Follow the backend's expiry; fall back to 2 hours if the token can't be decoded.
    setWithExpiry(TOKEN_KEY, token, getTokenLifetime(token) ?? 2*60*60*1000, remember ? localStorage : sessionStorage);
}

/** getAdminProfile - who is signed in, from the token's subject (the admin's email) */
export const getAdminProfile = () => {
    const token = getAdminToken();
    const email = token ? decodeToken(token)?.sub : null;
    const name = email ? email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Admin";
    return { email: email || "", name };
}

export const logoutAdmin = () => {
    stores().forEach((storage) => storage.removeItem(TOKEN_KEY));
}
