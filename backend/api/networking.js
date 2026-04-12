import networking from "../dbManagement/networking.js";
import { manager } from "../dbManagement/index.js";

export function parseHobbyFilters(searchParams) {
    const repeatedValues = searchParams.getAll("hobbies");
    const splitValues = repeatedValues.flatMap((value) =>
        String(value).split(",")
    );

    return [...new Set(
        splitValues
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
    )];
}

export async function networkAccountsHandler(_, res, url, mgr = manager) {
    try {
        const search = (url.searchParams.get("search") || "").trim();
        const hobbies = parseHobbyFilters(url.searchParams);
        const accounts = await networking.searchAccounts({ search, hobbies }, mgr);

        res.setHeader("Content-Type", "application/json");
        res.writeHead(200).end(JSON.stringify({
            accounts,
            count: accounts.length,
            appliedFilters: { search, hobbies }
        }));
    } catch (err) {
        console.error(`Network accounts handler error: ${err.message}`);
        res.writeHead(500).end("Failed to query networking accounts");
    }
}

export async function networkHobbiesHandler(_, res, url, mgr = manager) {
    try {
        const hobbies = await networking.getHobbies(mgr);
        res.setHeader("Content-Type", "application/json");
        res.writeHead(200).end(JSON.stringify({ hobbies }));
    } catch (err) {
        console.error(`Hobby list handler error: ${err.message}`);
        res.writeHead(500).end("Failed to query hobbies");
    }
}
