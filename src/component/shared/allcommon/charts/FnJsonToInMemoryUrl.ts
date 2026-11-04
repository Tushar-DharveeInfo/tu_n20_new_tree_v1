/**
 * Convert an in-memory URL (blob:) back to JSON.
 */
async function FnInMemoryUrlToJson(inMemoryUrl: string): Promise<any> {
    try {
        // Step 1: Fetch the blob from the in-memory URL
        const response = await fetch(inMemoryUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch Blob. Status: ${response.status}`);
        }

        // Step 2: Convert blob to text
        const blob = await response.blob();
        const text = await blob.text();

        // Step 3: Parse text to JSON
        const jsonData = JSON.parse(text);

        return jsonData;

    } catch (error) {
        console.error("Error converting in-memory URL to JSON:", error);
        throw error; // rethrow so caller can handle
    }
}
/**
 * Convert JSON → Blob → In-Memory URL
 */
function FnJsonToInMemoryUrl(jsonData: any): string {
    try {
        // Step 1: Convert JSON to string
        const jsonString = JSON.stringify(jsonData, null, 2);

        // Step 2: Create a Blob from the JSON string
        const blob = new Blob([jsonString], {
            type: "application/json",
        });

        // Step 3: Convert Blob to in-memory URL
        const inMemoryUrl = URL.createObjectURL(blob);

        return inMemoryUrl;

    } catch (error) {
        console.error("Error converting JSON to in-memory URL:", error);
        return ""; // return empty string on failure
    }
}

export { FnJsonToInMemoryUrl, FnInMemoryUrlToJson }