//import "./projects.css"

import { Project } from "../../utils";
import ProjectComponent from "./projects.html";
import { generateDOMWriteable } from "../../utils";

const projects = document.querySelector<HTMLDivElement>("div#projects ul.container");

const writeProjectToDOM = generateDOMWriteable<Project>(ProjectComponent, projects!);

export default writeProjectToDOM;