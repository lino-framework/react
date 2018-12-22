import React, {Component} from "react";
import PropTypes from "prop-types";
import {BrowserRouter as Router, HashRouter, Route, Link} from "react-router-dom";
import {LinoGrid} from "./LinoGrid";
import {LinoDetail} from "./LinoDetail";

import _ from 'lodash';

export class Actor extends Component {

    static propTypes = {
        match: PropTypes.object,
        actorId: PropTypes.string,
        packId: PropTypes.string,
        actorData: PropTypes.object
    };
    static defaultProps = {};

    constructor() {
        super();
        this.state = {};
        // this.method = this.method.bind(this);

    }

    // method() {return this.props.}

    componentDidMount() {
        console.log("Actor mount");
    };

    componentWillReceiveProps(nextProps) {
        const changedProps = _.reduce(this.props, function (result, value, key) {
            return _.isEqual(value, nextProps[key])
                ? result
                : result.concat(key)
        }, []);
        console.log('changedProps: ', changedProps)
    }

    render() {
        return <React.Fragment>
            {this.props.actorData.default_action === "grid" &&
            <Route exact path={this.props.match.match.path} render={(match) => (
                <LinoGrid
                    match={match}
                    actorId={this.props.actorId}
                    packId={this.props.packId}
                    key={this.props.packId + "." + this.props.actorId} // makes react recreate the LinoGrid instance
                    actorData={this.props.actorData}/>)
            }
            />
            }
            {this.props.actorData.detail_action === "detail" &&
            <Route path={`${this.props.match.match.path}/:pk`} render={(match) => (
                <LinoDetail
                    match={match}
                    actorId={this.props.actorId}
                    packId={this.props.packId}
                    pk={match.match.params.pk}
                    key={this.props.packId + "." + this.props.actorId} // makes react recreate the LinoGrid instance
                    actorData={this.props.actorData}
                />)}
            />
            }
            {this.props.actorData.detail_action === "show" &&
            <Route path={`${this.props.match.match.path}`} render={(match) => (
                <LinoDetail
                    match={match}
                    actorId={this.props.actorId}
                    packId={this.props.packId}
                    pk={"-99998"}
                    key={this.props.packId + "." + this.props.actorId} // makes react recreate the LinoGrid instance
                    actorData={this.props.actorData}
                />)}

            />
            }
            
        </React.Fragment>


    }

}
