type UnitResult = {
    sourceUnit: string;
    displayUnit: string;
};

function FnGetSourceAndDisplayUnit(
    measurementUnit: string,
    value: number,
    propName: string
): UnitResult {

    const dimensionProps = ["width", "length", "depth", "height", "tilex", "tiley"];

    let sourceUnit = "";
    let displayUnit = "";

    // Power
    if (propName === "Power") {
        sourceUnit = "w";

        if (value > 1000000) {
            displayUnit = "mw";
        } else if (value > 1000) {
            displayUnit = "kw";
        } else {
            displayUnit = "w";
        }

        return { sourceUnit, displayUnit };
    }

    // Weight
    if (propName === "Weight") {

        sourceUnit = "lb";

        if (measurementUnit === "Europe") {
            displayUnit = "kg";
        } else {
            displayUnit = "lb";
        }

        return { sourceUnit, displayUnit };
    }

    // Length / Dimension
    if (dimensionProps.includes(propName.toLowerCase())) {

        sourceUnit = "in";

        if (measurementUnit === "Europe") {

            const cm = value * 2.54;

            if (cm > 100) {
                displayUnit = "m";
            } else {
                displayUnit = "cm";
            }

        } else {

            if (value > 12) {
                displayUnit = "ft";
            } else {
                displayUnit = "in";
            }

        }

        return { sourceUnit, displayUnit };
    }

    return { sourceUnit, displayUnit };
}

export { FnGetSourceAndDisplayUnit }