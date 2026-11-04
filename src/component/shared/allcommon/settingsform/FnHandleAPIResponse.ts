
// this will extract data from the api response
const FnHandleAPIResponse = (
  jsonData: any,
  keyName: string
) => {
  try {
    let extractedData: any = null;

    if (
      !jsonData ||
      typeof keyName !== "string"
    ) {
      return extractedData;
    }

    let parsedData: any = null;

    try {
      parsedData = JSON.parse(jsonData);
    } catch (parseError) {
      console.error(
        "Error parsing API response:",
        parseError
      );

      return extractedData;
    }

    // Check if parsedData is an object
    if (
      typeof parsedData === "object" &&
      parsedData !== null
    ) {
      // Iterate over properties of parsedData
      Object.keys(parsedData).forEach(
        (key: string) => {
          try {
            // Check if the property value is an array and has at least one element
            if (
              Array.isArray(
                parsedData[key]
              ) &&
              parsedData[key]
                .length > 0
            ) {
              const objectData: any =
                parsedData[key][0]; // Assuming only the first element is needed

              if (
                Array.isArray(
                  objectData?.[
                  keyName
                  ]
                )
              ) {
                extractedData =
                  objectData[
                  keyName
                  ];

                return extractedData;
              }
              else if (
                typeof objectData?.[
                keyName
                ] == "object"
              ) {
                extractedData =
                  objectData[
                  keyName
                  ];

                return extractedData;
              }
              else if (
                typeof objectData?.[
                key
                ] == "string"
              ) {
                extractedData =
                  objectData[
                  key
                  ];

                return extractedData;
              }
            }
          } catch (itemError) {
            console.error(
              "Error processing API response item:",
              itemError
            );
          }
        }
      );
    }

    return extractedData;
  } catch (error) {
    console.error(
      "Error in handle API response: ",
      error
    );

    return null;
  }
}

export { FnHandleAPIResponse }