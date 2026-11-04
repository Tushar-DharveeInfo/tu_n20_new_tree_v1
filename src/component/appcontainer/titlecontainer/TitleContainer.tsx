
import { useEffect, useState } from "react"
import { useNavigate } from 'react-router-dom'
import { Burger24x24 } from "@n20a/libicon"
import '../allcss/TitleContainer.css'
import { useSessionContext } from "../../shared/context/hooks/SessionHooks"
import { useMainAppContext } from "../../shared/context/hooks/MainAppHooks"
import { FnGetCssVariable } from "../allcommon/FnGetCssVariable"
import { IMenuImage } from "../../shared/allinterface/menu/IMenuImage"
import { IMenuItem } from "../../shared/allinterface/menu/IMainMenu"
import { ITitleContainer } from "../allinterface/ITitleContainer"
import { AppQA } from "../../constants/Feature"
import { SettingGroups, SettingSubgroups } from "../../constants/Feature"
import { FnGetApplicationParameter } from "../../shared/allcommon/basic/FnGetApplicationParameter"
import { MenuImage } from "../../shared/menu/menuimage/MenuImage"
import { AppQaMenuContainer } from "./appqamenucontainer/AppQaMenuContainer"

const TitleContainer = (titleContainerProps: ITitleContainer) => {
    const [appqaData, setAppqaData] = useState<{ Menu: IMenuItem[], subMenu: IMenuItem[] }>();
    const [isOpenMenuIcon, setIsOpenMenuIcon] = useState<boolean>(false);
    const [menuImageClick, setMenuImageClick] = useState<boolean>(false)
    const [loginUserName, setLoginUserName] = useState<string>();
    const [impersonatedUserName, setImpersonatedUserName] = useState<string>();
    const [licenseeLogoTooltip, setLicenseeLogoTooltip] = useState<string>();
    const [menuImageObject, setMenuImageObject] = useState<IMenuImage>();
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();
    const navigate = useNavigate();

    useEffect(() => {
        setMenuImageObject({ ...menuImageObject, active: titleContainerProps.isMenuOpen, image: { ...menuImage.image, tooltip: titleContainerProps.isMenuOpen ? "Click to view menus" : "Click to hide menus" } } as IMenuImage);
        setIsOpenMenuIcon(titleContainerProps.isMenuOpen ?? false)
        if (titleContainerProps.isMenuOpen === false) {
            setMenuImageClick(false)
        }
    }, [titleContainerProps.isMenuOpen])
    const menuImage: IMenuImage = {
        uniqueName: titleContainerProps.uniqueName + 'menuImage', //Unique name for the control and required
        image: {
            //Below titleContainerProps are of image component
            uniqueName: titleContainerProps.uniqueName + 'image',
            source: <Burger24x24
                size={FnGetCssVariable('--image-size-2')}
                fill='none'
                strokeWidth={1} />,
            w: '30px',
            h: '30px',
            tooltip: "Click to view menus",
            type: "svg",
        },
        w: 40, //Width of the burger image container
        h: 40, //Height of the burger image container if not provided it will take h=w
        border: "none", //if provided it will overwrite the border css
        active: false, //it will be used to rotate the image. if true it will rotate it.
        activeBGColor: "transparent",
        allowAnimations: true,
    };
    useEffect(() => {
        setMenuImageObject(menuImage)
    }, [])

    useEffect(() => {
        if (sessionContext.SessionList.length) {
            const loginuser = sessionContext.SessionList.find((item) => item.VariableName === "LoginShortName");
            const impersonatedUser = sessionContext.SessionList.find((item) => item.VariableName === "ImpersonatedUserName");
            if (loginuser?.SessionValue && impersonatedUser?.SessionValue) {
                setLoginUserName(loginuser?.SessionValue);
                setImpersonatedUserName(impersonatedUser?.SessionValue);
            }
        }
    }, [sessionContext.SessionList])


    useEffect(() => {
        // Load licensee logo tooltip text from application parameters.
        const getTooltipFromAp = async () => {
            if (mainAppContext.apRecords) {
                const licenseeTooltip = FnGetApplicationParameter(SettingGroups.AdminConfiguration, SettingSubgroups.Configure, mainAppContext.apRecords, undefined, "LicenseeLogoTooltip");
                if (licenseeTooltip && licenseeTooltip.length && licenseeTooltip[0].Value) {
                    setLicenseeLogoTooltip(licenseeTooltip[0].Value ?? licenseeTooltip[0].DefaultAPValue);
                }
            }
        }
        getTooltipFromAp();
    }, [mainAppContext.apRecords])



    useEffect(() => {
        if (mainAppContext.featureRecords.length > 0) {
            const filteredAppqa = mainAppContext.featureRecords.filter((item) => { return ((item._Feature as unknown as number) > 40 && (item._Feature as unknown as number) < 50) || ((item._Feature as unknown as number) > 90 && (item._Feature as unknown as number) < 100) });
            if (filteredAppqa.length > 0) {
                const appqaMenu: IMenuItem[] = []
                const appqaSubMenu: IMenuItem[] = []
                filteredAppqa.sort((a, b) => b.SortOrder - a.SortOrder);
                filteredAppqa.forEach((element) => {
                    if (element._Feature === AppQA.Delegate && loginUserName && impersonatedUserName && loginUserName !== impersonatedUserName) {
                        element.Tooltip = `impersonating as ${impersonatedUserName}`;
                    }
                    if ((element._Feature as unknown as number) > 50 && (element._Feature as unknown as number) < 100) {
                        appqaSubMenu.push(element)
                    } else {
                        appqaMenu.push(element)
                    }
                })

                const menu = appqaSubMenu.sort((a, b) => a.SortOrder - b.SortOrder);

                setAppqaData({ Menu: appqaMenu, subMenu: menu });
            }
            else {
                setAppqaData({ Menu: [], subMenu: [] });
            }
        }
    }, [mainAppContext.featureRecords, loginUserName, impersonatedUserName, titleContainerProps.selectedFeature])



    // Route App QA menu actions to theme, navigation, or parent handler.
    const handleAppqaChange = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string | undefined, payload?: any) => {
        if (actionCode === "theme") {
            titleContainerProps.handleThemeChange(payload);
        }
        else if (actionCode === AppQA.Face) {
            return;
        }
        else if (actionCode === AppQA.Launch || actionCode === AppQA.Signout) {
            const updatedPayload = { ...payload, IsAppqa: true };
            navigate(`/feature/${actionCode}`, { state: updatedPayload });
        }

        else {
            if (titleContainerProps.handleAppqaSelect) {
                titleContainerProps.handleAppqaSelect(event, actionCode, payload)
            }
            else {
                const updatedPayload = { ...payload, IsAppqa: true };
                navigate(`/feature/${actionCode}`, { state: updatedPayload });
            }
        }
    }

    // Toggle main menu open state when burger icon is clicked or hovered.
    const handleMouse = (event: any, actionCode: string) => {
        if (event && event.type === "click") {
            setMenuImageClick(true)
        }
        if (event && event.type === "mouseenter" && menuImageClick) {
            return null
        }
        setMenuImageObject({ ...menuImageObject, active: !isOpenMenuIcon, image: { ...menuImage.image, tooltip: isOpenMenuIcon ? "Click to view menus" : "Click to hide menus" } } as IMenuImage);
        setIsOpenMenuIcon(!isOpenMenuIcon);
        titleContainerProps.handleMenuMouse && titleContainerProps.handleMenuMouse(!isOpenMenuIcon);
    }

    return (
        <div key={titleContainerProps.uniqueName} id="TitleContainer" className="nz-title-container" tabIndex={1}>

            {menuImageObject && <MenuImage {...menuImageObject}
                handleMouse={handleMouse}
                handleMouseEnter={!menuImageClick ? handleMouse : undefined}

            />}
            {appqaData && <AppQaMenuContainer
                uniqueName="appqa-menu-container"
                appqaData={appqaData}
                logoImageTooltip={licenseeLogoTooltip}
                selectedFeature={titleContainerProps.selectedAppqa
                    ? titleContainerProps.selectedAppqa
                    : ((titleContainerProps.selectedFeature &&
                        titleContainerProps.selectedFeature._Feature &&
                        (Object.values(AppQA) as string[]).includes(titleContainerProps.selectedFeature._Feature as string))
                        ? titleContainerProps.selectedFeature
                        : undefined)}
                handleAppqaChange={handleAppqaChange}
            />}

        </div>
    )
}
export { TitleContainer }