
import { IBasicGridColDef } from "../../shared/allinterface/tablegrid/IBasicGrid";

// this function returns column definition for provided rowData
const FnGetColumnDefinitionsFromRow = (
	rowData: Record<string, unknown>[]
): IBasicGridColDef[] => {

	// Handle empty or invalid data
	if (!Array.isArray(rowData) || rowData.length === 0) {
		return [];
	}

	const firstRow = rowData[0];

	// Handle invalid first row
	if (!firstRow || typeof firstRow !== "object") {
		return [];
	}

	const keys = Object.keys(firstRow);

	return keys.map((key, index): IBasicGridColDef => {
		const def: IBasicGridColDef = {
			field: key,
			headerName: key,
			suppressSizeToFit: true,
			editable: false,
			minWidth: 120
		};

		// Keep existing logic
		if (keys.length - 1 === index) {
			def.flex = 1;
			def.resizable = false;
		}

		return def;
	});
};

export { FnGetColumnDefinitionsFromRow };