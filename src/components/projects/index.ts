//import "./projects.css"

import { generateDOMWriteable, type Project } from "../../utils";
import ProjectComponent from "./projects.html";

const writeProjectToDOM = generateDOMWriteable<Project>(ProjectComponent);

export default writeProjectToDOM;
