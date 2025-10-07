//import "./tasks.css"

import { generateDOMWriteable, type Task } from "../../utils";
import TaskComponent from "./tasks.html";

const writeTaskToDOM = generateDOMWriteable<Task>(TaskComponent);

export default writeTaskToDOM;
