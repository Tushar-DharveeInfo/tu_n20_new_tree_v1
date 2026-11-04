
import { useEffect, useState } from 'react'
import { NodeMenu } from '../../../../shared/menu/nodemenu/NodeMenu'
import { IChangeMeta, YesNoControl } from '@n20a/libform'

export const RearPort = (props: any) => {
    let MappedPortsB = props?.data?.MappedPortsB?.toLowerCase()
    let postStatus = props?.data?.PortBStatus?.toLowerCase()
    const [isChecked, setIsChecked] = useState(false);

    useEffect(() => {
        const shouldCheck = props.data.MappedPortsB || props.data.isCheckB;
        setIsChecked(shouldCheck);
    }, [props.data.MappedPortsB, props.data.isCheckB]);

    const handleChangeRearCheckbox = (value: boolean, name: string, rowData: any) => {
        if (!rowData.MappedPortsB) {
            setIsChecked(value);
            props.handleChangeRearCheckbox(value, name, rowData, props)
        }
    };

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
            }}
            id={props.data.DeviceBPortID}
        >

            {props.data.CompositePortNameB && props.cablingMapProps.isReadOnly === false && <div
                id="desc"
                className="nz-desc nz-cabling-rtm"
                aria-describedby={"desc"}

            >
                <NodeMenu
                    showIcon={true}
                    uniqueName="mapping_FrontB"
                    container={"mapping_FrontB"}
                    selectedRow={props.selectedRow}
                    field="CompositePortNameB"
                    featureId={props.cablingMapProps.featureId}
                    rowIndex={props.rowIndex}
                    selectedNode={props.cablingMapProps.selected_node}
                    handleSelect={(value: any) => { props.handleSelect(value, "mapping_FrontB", props.selectedRow, props.rowIndex, props.cablingData) }}
                    featureData={props.featureRecords}
                />
            </div>}

            {props.data.CompositePortNameB && <div className='nz-rear-checkbox'>

                <YesNoControl name='rearPort'
                    value={props.data.MappedPortsB || isChecked ? true : false}
                    label=''
                    onChange={(value: boolean, meta: IChangeMeta) => {
                        handleChangeRearCheckbox(value, 'rearPort', props.data)
                    }} />
            </div>}
            <span

                title={JSON.stringify(props?.data, null, 2)}
                style={{ width: '100%', display: 'flex' }}
            >
                <>

                    {props.data.CompositePortNameB && (
                        <span
                            className="nz-port-map-span"
                            style={{
                                color:
                                    postStatus === undefined ||
                                        postStatus === null ||
                                        postStatus === "available" ||
                                        postStatus === "normal" ||
                                        postStatus === "connected" ||
                                        postStatus === "" || MappedPortsB
                                        ? "green"
                                        : postStatus === "bad"
                                            ? "red"
                                            : postStatus === "reserve"
                                                ? "blue"
                                                : postStatus === "block"
                                                    ? "black"
                                                    : "green",
                            }}
                        >
                            {postStatus === "block" ||
                                postStatus === "bad" ||
                                postStatus === "reserve"
                                ? (
                                    <>[O]</>
                                ) : MappedPortsB ? (
                                    <>[X]</>
                                ) : postStatus === undefined || postStatus === null ||
                                    postStatus === "" ||
                                    postStatus === "available" ||
                                    postStatus === "normal" ? (<>[&nbsp; &nbsp;]</>) : (
                                    <>[O]</>
                                )}
                        </span>
                    )}
                </>
                <span style={{ paddingLeft: 5, width: '100%' }}>{`${props.data.CompositePortNameB ? `${props.data.CompositePortNameB}` : ""
                    }`}</span>
            </span>

        </div>
    );
}