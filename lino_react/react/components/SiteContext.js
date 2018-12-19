import React from "react";

/**
 * The react method for supplying data deep into trees without having to pass it via props every time
 * see: https://reactjs.org/docs/context.html
 *      https://stackoverflow.com/questions/26120230/reactjs-how-to-pass-global-data-to-deeply-nested-child-components
 *
 */
export const SiteContext = React.createContext(
    {} // default value
);
