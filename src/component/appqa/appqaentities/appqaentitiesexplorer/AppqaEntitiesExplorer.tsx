
import '../../allcss/appqaentitiesexplorer/AppqaEntitiesExplorer.css'
import { MainMenu } from '../../../shared/menu/mainmenu/MainMenu'
import { IAppqaEntitiesExplorer } from "../../allinterface/iappqaentitiesexplorer/IAppqaEntitiesExplorer"

const AppqaEntitiesExplorer = (appqaEntitiesExplorerProps: IAppqaEntitiesExplorer) => {

    function handleSelect(event: React.MouseEvent<HTMLDivElement, MouseEvent>, actionCode?: string | undefined, payload?: any): void {
        if (appqaEntitiesExplorerProps.handleSelect) {
            appqaEntitiesExplorerProps.handleSelect(event, actionCode, payload)
        }
    }

    return (
        <div className='nz-dc-explorer-container' key={appqaEntitiesExplorerProps.uniqueName}>
            <MainMenu
                featureData={appqaEntitiesExplorerProps.featureData}
                uniqueName={appqaEntitiesExplorerProps.uniqueName}
                menuSize="sm"
                w="100%"
                h="100%"
                isIconVertical={false}
                isVertical={false}
                compact={false}
                isDisableSort={false}
                handleSelect={handleSelect}
            />
        </div>
    )
}

export { AppqaEntitiesExplorer }