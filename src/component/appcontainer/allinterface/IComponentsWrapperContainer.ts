import { IChartProfile } from "../../shared/allinterface/charts/INZChart";



interface IOverlayContainer {
    isVisible: boolean,
    x: number,
    y: number,
    width: number,
    height: number,
}
interface IHelptipContainer {
    isVisible: boolean,
    helptext: string;
}
interface IStatusBarContainer {
    isVisible: boolean,
    StatusBarType?: 'menu' | 'appqa',
    statusBarData?: Record<string, number | string>;
}


interface IPropsComponent {
    /**
        * The React component to be rendered.
        * It should be passed as a parameter.
        */
    component: React.ElementType;
    /**
        * Props to be passed to the component.
        * This is a record of key-value pairs where the keys are strings and values can be of any type.
        */
    props: Record<string, any>;
}
interface IChartContainer {
    isVisible: boolean,
    chartWidth: number;
    chartHeight: number;
    chartRows: number;
    chartColumns: number;
    chartProfiles?: IChartProfile[];
}
interface IComponentsWrapperContainer {
    uniqueName: string;
    featureId: string;
    helptipContainer: IHelptipContainer;
    statusBarContainer: IStatusBarContainer
    PropsComponent: IPropsComponent;
    chartContainer: IChartContainer;
    overlayContainer?: IOverlayContainer;
}
export type { IComponentsWrapperContainer }