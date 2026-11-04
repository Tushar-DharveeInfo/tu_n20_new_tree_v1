
import '../../allcss/appqasettingsexplorer/AppqaSettingsExplorer.css'
import { IAppqaSettingsExplorer } from '../../allinterface/iappqasettingsexplorer/IAppqaSettingsExplorer'
import { MainMenu } from '../../../shared/menu/mainmenu/MainMenu'
import { useEffect, useState } from 'react';
import { IMenuItem } from '../../../shared/allinterface/menu/IMainMenu';
import { FnDiagnostic } from '../../../shared/menu/nodemenu/MenuFunction';
import { useCommonVariableContext } from '../../../shared/context/hooks/CommonVariableHooks';

const AppqaSettingsExplorer = (settingsTreeviewProps: IAppqaSettingsExplorer) => {

    const [featureData, setFeatureData] = useState<IMenuItem[]>([]);
    const CommonVariableContext = useCommonVariableContext()
    useEffect(() => {
        if (settingsTreeviewProps.featureData) {
            const menu: IMenuItem[] = []
            settingsTreeviewProps.featureData.filter((item: IMenuItem) => {
                if (item.NodeType && item.NodeType?.toLowerCase().includes('fndiagnostic')) {
                    if (FnDiagnostic(CommonVariableContext.diagnosticLevel?.toString() === "0" ? false : true)) {
                        menu.push(item)
                    }
                } else {
                    menu.push(item)
                }
            }
            );
            setFeatureData(menu)
        }
    }, [settingsTreeviewProps.featureData])

    function handleSelect(event: React.MouseEvent<HTMLDivElement, MouseEvent>, actionCode?: string | undefined, payload?: any): void {
        if (settingsTreeviewProps.handleSelect) {
            settingsTreeviewProps.handleSelect(event, actionCode, payload)
        }
    }

    return (
        <div className='nz-dc-explorer-container' key={settingsTreeviewProps.uniqueName}>
            <MainMenu
                featureData={featureData}
                uniqueName={settingsTreeviewProps.uniqueName}
                menuSize="sm"
                w="100%"
                h="100%"
                isIconVertical={false}
                isVertical={false}
                compact={false}
                handleSelect={handleSelect}
            />
        </div>
    )
}
export { AppqaSettingsExplorer }
