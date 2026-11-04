

import { useContext } from "react";
import { InMemoryUrlContext } from "../contextandprovider/InMemoryUrl";

const useInMemoryUrlContext = () => useContext(InMemoryUrlContext);

export { useInMemoryUrlContext }