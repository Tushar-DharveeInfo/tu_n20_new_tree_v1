
import { useState } from 'react'
import { handleContainerKeyDown } from '../shared/allcommon/basic/FnHandleContainerKeyDown';
import { Label } from '../shared/basic/label/Label'
import { ForensicLog } from '../shared/sidebar/forensiclog/ForensicLog'
import { IAppqaLog } from './allinterface/IAppqaLog'

const AppqaLog = (appqaLogProps: IAppqaLog) => {

    const [headerText, setHeaderText] = useState<string>();
    const handleUpdateHeaderTitle = (title: string): void => {
        setHeaderText(title)
    }
    return (
        <div className='nz-wh-100 nz-d-flex-column nz-overflow-hidden' tabIndex={1} onKeyDown={handleContainerKeyDown} key={appqaLogProps.uniqueName}>
            <div className='nz-sub-header'>
                <Label uniqueName={`${appqaLogProps.uniqueName}-task-header`} label={`${appqaLogProps.headerText}${headerText ? " For " + headerText : ""}`} />
            </div>
            <div style={{ flex: '1 1 0%', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <ForensicLog
                    featureId={appqaLogProps.featureId}
                    isSetting={true}
                    loginType={'user'}
                    uniqueName={`${appqaLogProps.uniqueName}-all-forensic-log`}
                    handleUpdateHeaderTitle={handleUpdateHeaderTitle} />
            </div>
        </div>
    )
}

export default AppqaLog 