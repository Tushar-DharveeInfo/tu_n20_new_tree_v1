
import React, { useEffect, useState } from 'react'
import { NodeMenu } from '../../../../shared/menu/nodemenu/NodeMenu'
import { IChangeMeta, YesNoControl } from '@n20a/libform'

export const FrontPort = (props: any) => {
  let MappedPortsA = props?.data?.MappedPortsA?.toLowerCase()
  let PortAStatus = props?.data?.PortAStatus?.toLowerCase()

  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    const shouldCheck = props.data.MappedPortsA || props.data.isCheckA;
    setIsChecked(shouldCheck);
  }, [props.data.MappedPortsA, props.data.isCheckA]);

  const handleChangeForFront = (value: boolean, name: string, rowData: any) => {
    if (!rowData.MappedPortsA) {
      setIsChecked(value);
      props.handleChangeForFront(value, name, rowData, props)
    }
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: 'center'
      }}
      id={props.data.DeviceAPortID}
    >
      {props.data.CompositePortNameA && props.cablingMapProps.isReadOnly === false &&
        <span
          id="desc"
          className="nz-desc nz-cabling-rtm"
          aria-describedby={"desc"}

        >
          <NodeMenu
            showIcon={true}
            uniqueName='mapping_FrontA'
            container={"mapping_FrontA"}
            selectedRow={props.selectedRow}
            field="CompositePortNameA"
            featureId={props.cablingMapProps.featureId}
            selectedNode={props.cablingMapProps.selected_node}
            rowIndex={props.rowIndex}
            handleSelect={(value: any) => { props.handleSelect(value, "mapping_FrontA", props.selectedRow, props.rowIndex, props.cablingData) }}
            featureData={props.featureRecords}
          />
        </span>
      }
      <span
        title={JSON.stringify(props?.data, null, 2)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', marginRight: 10 }}
      >

        {props.data.CompositePortNameA &&
          <div className='nz-rear-checkbox'>
            <YesNoControl name='frontPort'
              value={props.data.MappedPortsA || isChecked ? true : false}
              label=''
              onChange={(value: boolean, meta: IChangeMeta) => {
                handleChangeForFront(value, 'frontPort', props.data)
              }} />
          </div>}
        {props.data.CompositePortNameA && (
          <span
            className="nz-port-map-span"
            style={{
              color:
                PortAStatus === undefined ||
                  PortAStatus === null ||
                  PortAStatus === "" ||
                  PortAStatus === "available" ||
                  PortAStatus === "normal" || PortAStatus === "connected" || MappedPortsA
                  ? "green"
                  : PortAStatus === "bad"
                    ? "red"
                    : PortAStatus === "reserve"
                      ? "blue"
                      : PortAStatus === "block"
                        ? "black"
                        : "green",
            }}
          >
            {
              PortAStatus === "block" ||
                PortAStatus === "bad" ||
                PortAStatus === "reserve"
                ? (
                  <>[O]</>
                ) :
                MappedPortsA ? (
                  <>[X]</>
                ) :
                  PortAStatus === undefined ||
                    PortAStatus === null ||
                    PortAStatus === "" ||
                    PortAStatus === "available" ||
                    PortAStatus === "normal" ? (<>[&nbsp; &nbsp;]</>) :
                    (
                      <>[O]</>
                    )}
          </span>
        )}
        <span style={{ paddingLeft: 5, width: '100%', paddingRight: 10 }} >
          {`${props.data.CompositePortNameA ? `${props.data.CompositePortNameA}` : ""}`}
        </span>
      </span>

    </div >
  );
}
