import React, {Component} from "react";
import PropTypes from "prop-types";
import {ProgressSpinner} from 'primereact/progressspinner';


export class LoadingMask extends Component {

    static propTypes = {
        masking: PropTypes.element,
        mask: PropTypes.bool,
        fillHeight: PropTypes.bool,
        backgroundColor: PropTypes.string
    };
    static defaultProps = {
        fillHeight: false,
         backgroundColor: "#007ad9",
    };

    constructor() {
        super();
        this.state = {};
        // this.method = this.method.bind(this);

    }

    // method() {return this.props.}

    componentDidMount() {

    };

    render() {
        const {masking, children, mask, fillHeight, backgroundColor} = this.props;
        // const Comp = "Table";
        // return loaded ? this.props.render(data, Comp) : <p>{placeholder}</p>;
        let wrapingStyle = {position: "relative"};
        if (fillHeight) {
            wrapingStyle.height = "100%";
        } else {
            wrapingStyle.overflow = "hidden" // if no fill, hide overflow. (used to hide loading mask when children is height 0
        }

        return <div style={wrapingStyle}>
            <div className={"lino-loading-mask"}
                 style={{
                     display: mask ? "block" : "none",
                     backgroundColor: backgroundColor,

                 }}>
                <div style={{
                    position: "absolute",
                    top: "50%",
                    right: "50%",
                    transform: "translate(50%,-50%)"
                }}>
                    <ProgressSpinner/> {/*spinner has opacity applied... minor issue not worth fixing*/}
                </div>
            </div>
            {children}
        </div>
    }
};
