
import { STATS } from "../../shared/interceptors/EndPoints";
import { IMainApp } from "../../shared/context/allinterface/IMainApp";
import { IStatusBar } from "../../shared/context/allinterface/IStatusBar";
import { IFetchProps } from "../allinterface/IStatusBarContainer";
import { FnCallApiToFetchWithResult } from "./FnCallApiToFetchWithResult";

const FnUpdateStatisticsAndRefresh = async (
    statusBarContext: IStatusBar,
    mainAppContext: IMainApp
) => {
    const res1 = await FnCallApiToFetchWithResult(
        {
            url: STATS.UpdateGlobalStatistics,
            data: {},
            allowShowLoader: true
        } as IFetchProps,
        statusBarContext
    );

    if (res1.status !== "200") return;

    const res2 = await FnCallApiToFetchWithResult(
        {
            url: STATS.UpdateSiteStatistics,
            data: {},
        } as IFetchProps,
        statusBarContext
    );

    if (res2.status !== "200") return;

    await mainAppContext.fetchApRecords(statusBarContext);
};

export { FnUpdateStatisticsAndRefresh }