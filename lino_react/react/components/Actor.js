import React, {Component} from "react";
import PropTypes from "prop-types";


export class Actor extends Component {

    static propTypes = {
        match: PropTypes.object, // routing match object
    };
    static defaultProps = {
    };

    constructor() {
        super();
        this.state = {
        };
        // this.method = this.method.bind(this);

    }

    // method() {return this.props.}

    componentDidMount() {
        console.log("Actor mount")
    };

    render() {
        const {match} = this.props;
        return <div>
            <p>{match.params.packId}</p>
            <p>{match.params.actorId}</p>
            <p>{match.params.actionId}</p>
        </div>
    }
}
