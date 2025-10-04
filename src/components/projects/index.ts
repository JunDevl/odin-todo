//import "./projects.css"

import { Project } from "../../utils";
import ProjectComponent from "./projects.html";
import { generateDOMWriteable } from "../../utils";

const writeProjectToDOM = generateDOMWriteable<Project>(ProjectComponent);

export default writeProjectToDOM;