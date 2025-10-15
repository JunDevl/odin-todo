//import "./projects.css"

import { generateDOMWriteable } from "../../utils/dom-manipulation";
import type { Project } from "../../utils/entities";
import ProjectComponent from "./projects.html";

const writeProject = generateDOMWriteable<Project>(ProjectComponent);

export default writeProject;
