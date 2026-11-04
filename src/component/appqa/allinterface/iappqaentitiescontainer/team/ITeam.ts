
interface ITeamProps {
    uniqueName?: string;
    selectedTeamId?: string;
    handleSelectedCard?: (team: ITeamRecord) => void;
}

interface ITeamRecord {
    EntID?: string;
    RecID?: string;
    _Team?: string;
    Team?: string;
    _Partner?: string;
    Partner?: string;
    Name?: string;
    Description?: string;
    Desc250?: string;
    [key: string]: unknown;
}

export type { ITeamProps, ITeamRecord };