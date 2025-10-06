//import "./tasks.css"

import { Task } from "../../utils";
import TaskComponent from "./tasks.html";
import { generateDOMWriteable } from "../../utils";

const todo = document.querySelector<HTMLDivElement>("div#todo ul.container");

const writeTaskToDOM = generateDOMWriteable<Task>(TaskComponent, todo!);

export default writeTaskToDOM;