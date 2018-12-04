import React, {Component} from "react";
import PropTypes from "prop-types";
import {BrowserRouter as Router, HashRouter, Route, Link} from "react-router-dom";


export class Actor extends Component {

    static propTypes = {
        match: PropTypes.object,
        actorId: PropTypes.string,
        packId: PropTypes.string,
        grid_data: PropTypes.object
    };
    static defaultProps = {};

    constructor() {
        super();
        this.state = {};
        // this.method = this.method.bind(this);

    }

    // method() {return this.props.}

    componentDidMount() {
        console.log("Actor mount")
    };

    render() {
        const {match} = this.props;
        return <Route exact path={match.path}/>
    }
}
