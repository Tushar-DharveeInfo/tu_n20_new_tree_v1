
import { ISession } from "../../context/allinterface/ISession";
import { IMenuItem } from "../../allinterface/menu/IMainMenu";
import { FnGetSessionVariableFromStorage } from "./FnGetSessionVariableFromStorage";

// update lable based on session variable  
const FnUpdateFeatureLabelFromSession = (
  featureData: IMenuItem[],
  sessionData?: ISession[]
) => {
  const extractPlaceholder = (input: string): string | null => {
    const match = input.match(/\{([^}]+)\}/);
    return match ? match[1].trim() : null;
  };

  const replacePlaceholder = (
    input: string,
    replacement: string
  ): string => {
    return input.replace(/\{[^}]+\}/, replacement);
  };

  const updatedFeatureData: IMenuItem[] = [];

  for (let index = 0; index < featureData.length; index++) {
    const element = featureData[index];
    let newLabel = element.Label;

    if (newLabel?.includes("{")) {
      const extractedData = extractPlaceholder(newLabel);

      const variableName = extractedData?.replace(/^#/, "").trim();

      const updatedSessionData =
        FnGetSessionVariableFromStorage(
          "",
          variableName,
          sessionData
        );

      if (updatedSessionData?.length) {
        const sessionValue =
          updatedSessionData[0].SessionValue;

        newLabel = replacePlaceholder(
          newLabel,
          sessionValue || ""
        );
      }
    }

    updatedFeatureData.push({
      ...element,
      Label: newLabel
    });
  }

  return updatedFeatureData;
};

export { FnUpdateFeatureLabelFromSession }