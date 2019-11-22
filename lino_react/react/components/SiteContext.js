import React from "react";

import classNames from 'classnames';
import queryString from "query-string"
import {shouldComponentUpdate} from "./LinoComponents";
import PropTypes from "prop-types";

import {fetch as fetchPolyfill} from 'whatwg-fetch' // fills fetch

Storage.prototype.setObject = function (key, value) {
    this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};

/**
 * The react method for supplying data deep into trees without having to pass it via props every time
 * see: https://reactjs.org/docs/context.html
 *      https://stackoverflow.com/questions/26120230/reactjs-how-to-pass-global-data-to-deeply-nested-child-components
 *
 */
export const SiteContext = React.createContext(
    {} // default value
);

export const ActorContext = React.createContext(
    {} // default value
);


export class ActorData extends React.Component {

    static propTypes = {
        actorId: PropTypes.string.isRequired,
    };

    constructor() {
        super();
        this.state = {
            loaded: false,
            actorData: null
        }
    }

    getData(id, fn) {
        let store = window.localStorage,
            {user_type, lang} = window.App.state.user_settings,
            su = window.App.state.user_settings.su_user_type,
            key = `ActorData_${su || user_type}_${lang}_${id}`,
            data = store.getObject(key);

        if (data) {
            fn(data);
        } else {
            fetchPolyfill(`/media/cache/json/Lino_${id}_${su || user_type}_${lang}.json`).then(
                window.App.handleAjaxResponse
            ).then((data) => {
                    console.log(`Fetched data for ${id}`, data);
                    store.setObject(key, data);
                    fn(data)
                }
            )
        }
    }

    componentDidMount() {
        if (this.props.actorId === undefined) {
            this.setState({
                loaded: true,
            });
        }
        else {
            this.getData(this.props.actorId,
                (data) => {
                    this.setState({
                        loaded: true,
                        actorData: data
                    })
                }
            )
        }
    }

    render() {

        if (this.props.actorId === undefined) {
            return this.props.children
        }
        else {
            return <ActorContext.Provider value={this.state.actorData}>
                {this.state.loaded && this.props.children}
            </ActorContext.Provider>
        }
    }
}
