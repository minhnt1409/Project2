import connection from "../../db/connect.js";
import responseError, { callRes } from "../response/response.js";

const execDeleteQuery = (query) => {
    let errorExecution = false;
    connection.query('SET SQL_SAFE_UPDATES = 0');
    connection.query(query, (error, result) => {
        errorExecution = true;
    });
    connection.query('SET SQL_SAFE_UPDATES = 1');
    return errorExecution;
}

export default execDeleteQuery;