function GetTransformValues(transAtt: any) {
    const data = [0, 0, 1];
    if (transAtt.search("translate") != -1) {
        var start: any = transAtt.search("translate") + 10;
        var valuelist: any = transAtt.substring(start);
        valuelist = valuelist.replace(')', '');
        const digits: any = valuelist.split(',');

        data[0] = Number(digits[0]);
        data[1] = Number(digits[1]);

        start = transAtt.search("scale") + 6;
        if (start >= 0) {
            valuelist = transAtt.substring(start);
            const digits2: any = valuelist.split(')');
            data[2] = Number(digits2[0]);
        }
    }
    return data
}

function SetSlotInfo(doc: any, PXOffset: any, PYOffset: any, Slot: any) {
    //search the rect with SVGSlot class and correct dimensions, add id and descr
    let xpos: any = Slot.SlotViewX - PXOffset;
    let ypos: any = Slot.SlotViewY - PYOffset;
    let width: any = Slot.SlotViewWidth;
    let height: any = Slot.SlotViewLength;

    if (Slot.SlotMountType == 'Plug') {
        xpos = xpos - 25;
        ypos = ypos - 25;
        width = width + 50;
        height = height + 50;
    }
    let selector: any = 'rect.SVGSlot[x="' + xpos + '"][y="' + ypos + '"][width="' + width + '"][height="' + height + '"]';
    const SlotRectNode: any = doc.querySelector(selector);
    if (SlotRectNode != null) {
        SlotRectNode.setAttribute("id", Slot.SlotID);
        if (Slot.SlotComposite != null && Slot.SlotComposite.length > 0) SlotRectNode.setAttribute("desc", Slot.SlotComposite);
        else SlotRectNode.setAttribute("desc", Slot.SlotName);
    }
}


const InsertModule = (docSVGParent: any, PXOffset: any, PYOffset: any, varBBox: any, varExtent: any,
    SVGChildData: any, SlotID: any, SlotName: any, SlotMountType: any, SlotIndex: any, SlotViewX: any,
    SlotViewY: any, SlotViewWidth: any, SlotViewLength: any, SlotMountAngle: any, ModViewWidth: any,
    ModViewLength: any, ParentEntity: any, ParentViewShortName: any, ParentScale: any, ModuleScale: any, ModuleTooltip: any, ModuleID: any) => {
    var X0 = 0;
    var Y0 = 0;
    var XExtent = 0;
    var YExtent = 0;
    var PNode;
    var MXOffset = 0;
    var MYOffset = 0;
    var NewScale = ModuleScale / (ParentScale * 1.0);
    var Continue = 0;
    var NewAngle = 0;
    var ModHoriz = true;
    var SlotHoriz = true;
    if (SlotViewLength > SlotViewWidth) SlotHoriz = false;
    if (ModViewLength > ModViewWidth) ModHoriz = false;

    let SVGChild = "";

    try {
        const decodedOnce = atob(SVGChildData);

        // If already actual SVG, do NOT decode again
        if (decodedOnce.trim().startsWith("<svg")) {
            SVGChild = decodedOnce;
        } else {
            SVGChild = atob(decodedOnce);
        }

        // Replace HTML space entities (compatible with older TS targets)
        SVGChild = SVGChild.replace(/(&nbsp;|&#160;)/g, " ");

    } catch (e) {
        console.error("Invalid child SVG base64 data", e);
    }
    const parser = new DOMParser();
    const docChild = parser.parseFromString(SVGChild, "application/xml");
    const errorNode = docChild.querySelector("parsererror");
    let Error = 0;
    if (errorNode) {
        console.error("error while parsing");
        Error = 1
    }
    else {
        let xpos = SlotViewX - PXOffset;
        let ypos = SlotViewY - PYOffset;
        let selector = 'rect.SVGSlot[id="' + SlotID + '"]'
        const SlotRectNode = docSVGParent.querySelector(selector);
        if (SlotRectNode != null) {

            if (SlotMountAngle != 0)
                NewAngle = 360 - SlotMountAngle;
            let TX = 0;
            let TY = 0;
            let RCenterX = 0;
            let RCenterY = 0;
            let SlotX = SlotRectNode.getAttribute("x") | 0;
            let SlotY = SlotRectNode.getAttribute("y") | 0;
            let SlotWidth = SlotRectNode.getAttribute("width") | 0;
            let SlotHeight = SlotRectNode.getAttribute("height") | 0;
            var svgTrans: any
            PNode = SlotRectNode.parentElement;
            let childG = docChild.getElementsByTagName("g");
            if (childG != null) {
                let Next = childG[1];
                var Att = Next.getAttribute("transform");       //like "scale(0.0750) translate(-53,-94)"
                var Values = GetTransformValues(Att);
                if (Values != null) {
                    MXOffset = Values[0];
                    MYOffset = Values[1];
                }
                X0 = SlotX;
                Y0 = SlotY;
                XExtent = SlotWidth;
                YExtent = SlotHeight;
                if (SlotMountType.trim().toUpperCase() == "RU")   //can be multiple/partial RU, calculate the Y position based on proportion of module to slot 
                {
                    let NewSlotHt = (((ModViewLength * 1.0) / ModViewWidth) * SlotWidth) | 0; //use |0 to make it int
                    X0 = SlotX;
                    Y0 = SlotY - NewSlotHt + SlotHeight;
                    YExtent = NewSlotHt;
                    NewScale = SlotWidth / (ModViewWidth * 1.0);
                    svgTrans = "scale(" + NewScale.toString() + ") translate(" + MXOffset.toString() + "," + MYOffset.toString() + ")";
                }
                else if (SlotMountType.trim().toUpperCase() == "PLUG")  //InOutPlug for rack or shelf, calculate the Y position X position, viewbox, 
                {
                    let NewModHt = ((ModViewLength * 1.0) * ModuleScale / ParentScale) | 0;
                    let NewModWd = ((ModViewWidth * 1.0) * ModuleScale / ParentScale) | 0;

                    //set position indicators
                    var bBL = 0; //bottom ones - devices sit on these, BL right bottom point of device anchored to this point 
                    var bBC = 0;
                    var bBR = 0;
                    var bTL = 0; //top ones - devices hang down
                    var bTC = 0;
                    var bTR = 0;
                    var bL = 0;  //vertically centered
                    var bC = 0;
                    var bR = 0;

                    YExtent = NewModHt;
                    XExtent = NewModWd;

                    if (ParentEntity.trim().toUpperCase() == "__SHELF") //sit the device on top of the shelf
                    {
                        if (varBBox.left + varBBox.width / 8 > SlotX)
                            bBR = 1;
                        else if (varBBox.left + (varBBox.width * 7) / 8 < SlotX - SlotWidth)
                            bBL = 1;
                        else bBC = 1
                    }
                    else {
                        if (varBBox.left + varBBox.width / 3 > SlotX) //left side
                        {
                            if (varBBox.top + varBBox.height / 3 > SlotY)
                                bTL = 1;
                            else if (varBBox.top + (varBBox.height * 2) / 3 < SlotY + SlotHeight)
                                bBL = 1;
                            else bL = 1;
                        }
                        else if (varBBox.left + (varBBox.width * 2) / 3 < SlotX - SlotWidth) //right side
                        {
                            if (varBBox.top + varBBox.height / 3 > SlotY)
                                bTR = 1;
                            else if (varBBox.top + (varBBox.height * 2) / 3 < SlotY + SlotHeight)
                                bBR = 1;
                            else bR = 1;
                        }
                        else {
                            if (varBBox.top + varBBox.height / 3 > SlotY)
                                bTC = 1;
                            else if (varBBox.top + (varBBox.height * 2) / 3 < SlotY + SlotHeight)
                                bBC = 1;
                            else bC = 1;
                        }
                    }
                    //Left
                    if (bL == 1) {
                        X0 = SlotX - NewModWd + SlotWidth / 2;
                        Y0 = SlotY + SlotHeight / 2 - NewModHt / 2;
                        if (NewModWd > varExtent.left)
                            varExtent.left = NewModWd
                    }
                    else if (bTL == 1) {
                        X0 = SlotX - NewModWd + SlotWidth / 2;
                        Y0 = SlotY + SlotHeight / 2;
                        if (NewModWd > varExtent.left)
                            varExtent.left = NewModWd
                    }
                    else if (bBL == 1) {
                        X0 = SlotX - NewModWd + SlotWidth / 2;
                        Y0 = SlotY + SlotHeight / 2 - NewModHt;
                        if (NewModWd > varExtent.left)
                            varExtent.left = NewModWd
                    }
                    //Right
                    else if (bR == 1) {
                        X0 = SlotX + SlotWidth / 2;
                        Y0 = SlotY + SlotHeight / 2 - NewModHt / 2;
                        if (NewModWd > varExtent.right)
                            varExtent.right = NewModWd
                    }
                    else if (bTR == 1) {
                        X0 = SlotX + SlotWidth / 2;
                        Y0 = SlotY + SlotHeight / 2;
                        if (NewModWd > varExtent.right)
                            varExtent.right = NewModWd
                    }
                    else if (bBR == 1) {
                        X0 = SlotX + SlotWidth / 2;
                        Y0 = SlotY + SlotHeight / 2 - NewModHt;
                        if (NewModWd > varExtent.right)
                            varExtent.right = NewModWd
                    }
                    //Center
                    else if (bC == 1) {
                        X0 = SlotX + SlotWidth / 2 - NewModWd;
                        Y0 = SlotY + SlotHeight / 2 - NewModHt / 2;
                        if (NewModWd > varExtent.right)
                            varExtent.right = NewModWd
                    }
                    else if (bTC == 1) {
                        X0 = SlotX + SlotWidth / 2 - NewModWd;
                        Y0 = SlotY + SlotHeight / 2;
                        if (NewModWd > varExtent.right)
                            varExtent.right = NewModWd
                    }
                    else if (bBC == 1) {
                        X0 = SlotX + SlotWidth / 2 - NewModWd;
                        Y0 = SlotY + SlotHeight / 2 - NewModHt;
                        if (NewModWd > varExtent.right)
                            varExtent.right = NewModWd
                    }

                    if (NewAngle == 0)
                        svgTrans = "scale(" + NewScale.toString() + ") translate(" + MXOffset.toString() + "," + MYOffset.toString() + ")";
                    else
                        svgTrans = "scale(" + NewScale.toString() + ") translate(" + (SlotX - X0).toString() + "," + (SlotY - Y0).toString() + ") rotate(" + NewAngle.toString() + "," + (ModViewWidth / 2).toString() + "," + (ModViewLength / 2).toString() + ")";
                }
                else if ((SlotMountAngle != 0 || (ModHoriz != SlotHoriz))) //normal slot mounting with rotate
                {
                    TX = ModViewLength / 2 - ModViewWidth / 2 + MXOffset;
                    TY = ModViewWidth / 2 - ModViewLength / 2 + MYOffset;

                    RCenterX = ModViewWidth / 2 - MXOffset;
                    RCenterY = ModViewLength / 2 - MYOffset;
                    if ((SlotMountAngle == 0) && (ModHoriz != SlotHoriz)) NewAngle = 270; //module auto rotate 90 case

                    svgTrans = "scale(" + NewScale.toString() + ") translate(" + TX + "," + TY.toString() + ") rotate(" + NewAngle.toString() + "," + RCenterX.toString() + "," + RCenterY.toString() + ")";
                }
                else  //normal slot mounting
                {
                    svgTrans = "scale(" + NewScale.toString() + ") translate(" + MXOffset.toString() + "," + MYOffset.toString() + ")";
                }
                Continue = 1
            }
        }
        else {
            let selector = 'g[ID="SVGUse"]';
            let GNode = docSVGParent.querySelector(selector);
            if (GNode != null) {
                PNode = GNode.firstElementChild;
                let SlotX = SlotViewX - PXOffset;
                let SlotY = SlotViewY - PYOffset;
                let SlotWidth = SlotViewWidth;
                let SlotHeight = SlotViewLength;

                var groupList = docChild.getElementsByTagName('g');//'SVGBody');
                let Att: any
                let Values: any
                var ZXOffset = 0
                var ZYOffset = 0
                if (groupList != null) {
                    var topGroup = groupList[0];
                    if (topGroup != null && ((topGroup.getAttribute("id") == "SVGBody") || (topGroup.getAttribute("ID") == "SVGBody"))) {
                        var FC = topGroup.firstElementChild;
                        if (FC != null && FC.tagName == "g") {
                            Att = FC.getAttribute("transform");       //like "scale(0.0750) translate(-53,-94)"
                            Values = GetTransformValues(Att);
                            if (Values != null) {
                                var ZPXOffset = Values[0];
                                var ZPYOffset = Values[1];
                            }
                        }
                    }
                }


                if (SlotMountType.trim().toUpperCase() == "PM" && SlotName.includes("Left"))   //zero RU mount on Left, calculate the Y position X position, viewbox, 
                {
                    let NewModHt = ((ModViewLength * 1.0) * ModuleScale / ParentScale) | 0;
                    let NewModWd = ((ModViewWidth * 1.0) * ModuleScale / ParentScale) | 0;

                    //0 degree
                    X0 = SlotX - NewModWd;
                    Y0 = SlotY - NewModHt + SlotHeight;
                    YExtent = NewModHt;
                    XExtent = NewModWd;

                    switch (NewAngle) {
                        case 90:
                            {
                                X0 = SlotX;
                                Y0 = SlotY - NewModWd;
                                YExtent = NewModWd;
                                XExtent = NewModHt;
                                break;
                            }
                        case 180:
                            {
                                X0 = SlotX - NewModHt;
                                Y0 = SlotY;
                                break;
                            }
                        case 270:
                            {
                                X0 = SlotX;
                                Y0 = SlotY;
                                YExtent = NewModWd;
                                XExtent = NewModHt;
                                break;
                            }
                    }
                    svgTrans = "scale(" + NewScale.toString() + ") translate(" + ZPXOffset.toString() + "," + ZPYOffset.toString() + ")";

                }
                else if (SlotMountType.trim().toUpperCase() == "PM" && SlotName.includes("Right"))   //(ZR) zero RU mount on Right, calculate the Y position X position, viewbox, 
                {
                    let NewModHt = ((ModViewLength * 1.0) * ModuleScale / ParentScale) | 0;
                    let NewModWd = ((ModViewWidth * 1.0) * ModuleScale / ParentScale) | 0;

                    //0 degree
                    X0 = SlotX + SlotWidth;
                    Y0 = SlotY - NewModHt + SlotHeight;
                    YExtent = NewModHt;
                    XExtent = NewModWd;

                    switch (NewAngle) {
                        case 90:
                            {
                                X0 = SlotX - NewModHt;
                                Y0 = SlotY - NewModWd;
                                YExtent = NewModWd;
                                XExtent = NewModHt;
                                break;
                            }
                        case 180:
                            {
                                X0 = SlotX - NewModWd;
                                Y0 = SlotY;
                                break;
                            }
                        case 270:
                            {
                                X0 = SlotX;
                                Y0 = SlotY;
                                YExtent = NewModWd;
                                XExtent = NewModHt;
                                break;
                            }
                    }
                    svgTrans = "scale(" + NewScale.toString() + ") translate(" + ZPXOffset.toString() + "," + ZPYOffset.toString() + ")";
                }
                Continue = 1;
            }
        }

        if (Continue == 1) {

            let GroupEl: any = docSVGParent.createElementNS("http://www.w3.org/2000/svg", "g");
            let GroupTransform = "translate(" + X0.toString() + ',' + Y0.toString() + ")";
            GroupEl.setAttribute("class", "SVGModule");
            GroupEl.setAttribute("transform", GroupTransform);
            GroupEl.setAttribute("id", ModuleID);
            PNode.parentElement.after(GroupEl);

            //create Rect element
            //add the rect   <rect class="SVGPart SVGModule" x="1734" y="120" width="562" height="198"/>
            let RectEl = docSVGParent.createElementNS("http://www.w3.org/2000/svg", "rect");
            RectEl.setAttribute("class", "SVGPart SVGModRect");

            RectEl.setAttribute("x", X0.toString());
            RectEl.setAttribute("y", Y0.toString());
            RectEl.setAttribute("width", XExtent.toString());
            RectEl.setAttribute("height", YExtent.toString());
            RectEl.setAttribute("data-parent", ModuleID);
            let TitleEl = docSVGParent.createElementNS("http://www.w3.org/2000/svg", "title");
            TitleEl.textContent = ModuleTooltip;
            RectEl.appendChild(TitleEl);
            GroupEl.after(RectEl);

            let ViewBox = "0 0 " + XExtent.toString() + " " + YExtent.toString();//NOT rootChild.GetAttribute("viewBox");
            let SVGEl = docSVGParent.createElementNS("http://www.w3.org/2000/svg", "svg");
            SVGEl.setAttribute("x", "0");
            SVGEl.setAttribute("y", "0");
            SVGEl.setAttribute("width", XExtent.toString());
            SVGEl.setAttribute("height", YExtent.toString());
            SVGEl.setAttribute("viewBox", ViewBox);
            GroupEl.appendChild(SVGEl);

            let GroupChildEl = docSVGParent.createElementNS("http://www.w3.org/2000/svg", "g");

            GroupChildEl.setAttribute("transform", svgTrans);
            SVGEl.appendChild(GroupChildEl);

            //----append the module SVGUse section
            selector = 'g[ID="SVGUse"]';//"g[contains(@ID,'SVGUse')]";

            var cldEl: any = docChild.querySelector(selector);
            let ChildUse: any = cldEl;

            ChildUse.childNodes?.forEach((element: any) => {
                let dupNode = docSVGParent.importNode(element, true);
                GroupChildEl.appendChild(dupNode);
            });

            //----append the module defs section to parent defs, if needed
            let xl = docSVGParent.getElementsByTagName("defs");
            let ParentDefs = xl[0];
            cldEl = docChild.getElementsByTagName("defs");
            let ChildDefs = cldEl[0];

            for (let i = 0; i < ChildDefs.children.length; i++) {
                //add if it does not already exist
                let ChildID = ChildDefs.children[i].getAttribute("id");
                let Criteria = 'svg[id="' + ChildID + '"]';//"svg[@id='" + ChildID + "']"; //XmlNodeList xl = SVGChild.SelectNodes("//a:g[contains(@ID,'SVGUse')]", mgr);
                let Found = ParentDefs.querySelector(Criteria);
                if (Found == null) {
                    let dupNode = docSVGParent.importNode(ChildDefs.children[i], true);
                    ParentDefs.appendChild(dupNode);
                }
            }

        }
    }
    return docSVGParent;
}
function SelectSlot(SlotEntID: any, container?: HTMLElement | Element | null) {
    //search the rect with data-parent=DeviceViewEntID and add the SVGSel class
    let selector: any = 'rect.SVGSlot[id="' + SlotEntID + '"]';
    const root = container || document;
    const SlotRectNode: any = root.querySelector(selector);
    if (SlotRectNode != null) {
        SlotRectNode.classList.add('SVGSel');
    }
}

function SelectModule(DeviceViewEntID: any, container?: HTMLElement | Element | null) {
    //search the rect with data-parent=DeviceViewEntID and add the SVGSel class
    let selector: any = 'rect.SVGModRect[data-parent="' + DeviceViewEntID + '"]';
    const root = container || document;
    const ModuleRectNode = root.querySelector(selector);
    if (ModuleRectNode != null) {
        ModuleRectNode.classList.add('SVGSel');
    }
}
// Javascript Code
function CreateSVGForPreview(SVGDataInput: any) {
    //SVGDataInput is data.SVGJson from API call device/get_svgdata (definition of rack plus devices) to create SVG
    var PXOffset = 0;
    var PYOffset = 0;
    var SVGScale = 1;
    var ParentSVG = '';

    //Hold to update later if needed
    var ViewBoxObj;
    var FirstChildObj;
    var TransValue;

    const obj = JSON.parse(SVGDataInput);
    if (obj != null) {
        let Name = obj.Parent[0].EntityName;
        let ShapeID = obj.Parent[0].ShapeID;
        let ParentSVGData = obj.Parent[0].SVGFile;
        let Scale = obj.Parent[0].Scale;
        let decodedOnce = atob(ParentSVGData);
        try {

            // If already valid SVG, don't decode again
            if (decodedOnce.trim().startsWith("<svg")) {
                ParentSVG = decodedOnce;
            } else {
                // Needs second decode
                ParentSVG = atob(decodedOnce);
            }

            ParentSVG = ParentSVG.replace(/(&nbsp;|&#160;)/g, ' ');
        } catch (error) {
            console.error('error :', error);

        }
        var FC: any
        let Error = 0
        if (obj.Parent[0].Mounted != null || obj.Parent[0].Slots != null) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(ParentSVG, "application/xml");
            const errorNode = doc.querySelector("parsererror");
            if (errorNode) {
                console.error("error while parsing");
                Error = 1
            }
            else {
                var groupList = doc.getElementsByTagName('g');//'SVGBody');
                if (groupList != null) {
                    var topGroup = groupList[0];
                    if (topGroup != null && ((topGroup.getAttribute("id") == "SVGBody") || (topGroup.getAttribute("ID") == "SVGBody"))) {
                        FC = topGroup.firstElementChild;
                        if (FC != null && FC.tagName == "g") {
                            var Att = FC.getAttribute("transform");       //like "scale(0.0750) translate(-53,-94)"
                            var Values = GetTransformValues(Att);
                            if (Values != null) {
                                PXOffset = Values[0];
                                PYOffset = Values[1];
                                SVGScale = Values[2];
                                FirstChildObj = FC;
                                TransValue = Values;
                            }

                        }
                    }
                    //for each slot, add id (SlotEntID) and the slot name as descr
                    if (obj.Parent[0].Slots != null)
                        for (var i = 0; i < obj.Parent[0].Slots.length; i++) {
                            var Slot = obj.Parent[0].Slots[i];
                            SetSlotInfo(doc, PXOffset, PYOffset, Slot);
                        }

                    let varExtent = {
                        left: 0, top: 0, right: 0, bottom: 0
                    };

                    let varBBox = {
                        left: obj.Parent[0].ViewX, top: obj.Parent[0].ViewY, width: obj.Parent[0].ViewWidth, height: obj.Parent[0].ViewLength
                    };
                    //for each child, get the variables and insert the child into the parent container
                    if (obj.Parent[0].Mounted != null) {

                        for (var i = 0; i < obj.Parent[0].Mounted.length; i++) {
                            var child = obj.Parent[0].Mounted[i];
                            var ParentEntity = obj.Parent[0].EntityName;
                            var ParentViewShortName = child.ViewShortName;
                            InsertModule(doc, PXOffset, PYOffset, varBBox, varExtent, child.SVGFile, child.SlotID, child.Name, child.SlotMountType, child.SlotIndex, child.SlotViewX, child.SlotViewY,
                                child.SlotViewWidth, child.SlotViewLength, child.MountedDeviceViewAngle, child.ModViewWidth, child.ModViewLength, ParentEntity,
                                ParentViewShortName, Scale, child.Scale,
                                child._Device, child.MountedDeviceViewID);
                        }
                    }

                    if (varExtent.left > 0 || varExtent.top > 0 || varExtent.right > 0 || varExtent.bottom > 0) {
                        //change viewbox -- width+(l+r)*scale ,  ht +(t+b)*scale
                        var FirstSVG = doc.getRootNode();
                        var NodeEl: any = doc.firstElementChild;
                        var SVGAtt: any = NodeEl.getAttribute("viewBox")
                        //parse the viewbox  0 0 26 137
                        const data = [0, 0, 0, 0]
                        const digits = SVGAtt.split(' ');

                        data[0] = Number(digits[0]);
                        data[1] = Number(digits[1]);
                        data[2] = Number(digits[2]);
                        data[3] = Number(digits[3]);

                        var NewWidth = data[2] + (varExtent.left + varExtent.right) * SVGScale;
                        var NewHeight = data[3] + (varExtent.top + varExtent.bottom) * SVGScale;
                        var NewViewBox = data[0] + ' ' + data[1] + ' ' + NewWidth + ' ' + NewHeight
                        NodeEl.setAttribute("viewBox", NewViewBox);

                        //change transform on First child -- x+left, y+top
                        var NewX = PXOffset + varExtent.left
                        var NewY = PYOffset + varExtent.top
                        var NewAtt = 'scale(' + SVGScale + ') translate(' + NewX + ',' + NewY + ')'
                        FC.setAttribute("transform", NewAtt)
                    }
                    //serialize the parent composite device
                    const serializer = new XMLSerializer();
                    ParentSVG = serializer.serializeToString(doc);
                }
            }

        }
    }
    return ParentSVG;
}


export { SelectModule, SelectSlot, CreateSVGForPreview }