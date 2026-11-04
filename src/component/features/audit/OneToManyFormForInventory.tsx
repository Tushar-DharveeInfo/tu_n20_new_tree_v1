
import { FormElementsRenderer } from '@n20a/libform'
import { IOneToManyFormForInventory } from '../allinterface/audit/IOneToManyFormForInventory'
import { BasicGrid } from '../../shared/tablegrid/BasicGrid'
import { useMainAppContext } from '../../shared/context/hooks/MainAppHooks'

const OneToManyFormForInventory = (_props: IOneToManyFormForInventory) => {
    const { uniqueName, renderedFormElements, hideAddForm, gridData, featureId, gridColumns
        , containerName, allowEdit, allowDelete, handleValueChange, handleNodeMenuOnClick, handleDeleteRecord
        , handleEditRecord, allowColumnFilter = true } = _props
    const mainAppContext = useMainAppContext();

    return (
        <div key={uniqueName} className="nz-one-to-many-form-container">
            <div className="nz-one-to-many-add-edit-container">
                {renderedFormElements && !hideAddForm ?
                    <FormElementsRenderer key={uniqueName}
                        formElements={renderedFormElements}
                        onValuesChange={handleValueChange} />
                    :
                    <></>
                }
            </div>
            {gridData.length && gridColumns.length ?
                <BasicGrid
                    uniqueName={uniqueName + "one-to-many-grid"}
                    instanceName={containerName ?? "PropertyPane"}
                    showGrid={true}
                    rowData={gridData}
                    containerName={containerName ?? "PropertyPane"}
                    columnDefs={gridColumns}
                    allowEditButton={allowEdit ? true : false}
                    allowColumnResize={true}
                    allowColumnFilter={allowColumnFilter}
                    hideCopyRowIcon={true}
                    hideRowKebabMenu={false}
                    featureId={featureId}
                    allowDeleteButton={allowDelete ? true : false}
                    handleMouseForEdit={handleEditRecord}
                    featureData={mainAppContext.featureRecords}
                    handleNodeMenuOnClick={handleNodeMenuOnClick}
                    handleMouseForDelete={handleDeleteRecord} />
                :
                <></>
            }

        </div >
    )
}

export default OneToManyFormForInventory