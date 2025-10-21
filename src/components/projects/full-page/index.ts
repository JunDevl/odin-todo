//import "./projects.css"

import { generateDOMWriteable } from "../../../utils/dom-manipulation";
import type { Project } from "../../../utils/entities";
import FullPageProjectComponent from "./project.html";

const writeFullPageProjectToDOM = generateDOMWriteable<Project>(
	FullPageProjectComponent,
);

export default writeFullPageProjectToDOM;
