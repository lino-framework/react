import React, { Component } from "react";
import PropTypes from "prop-types";
import queryString from 'query-string';
// import Table from "./Table";

class DataProvider extends Component {
  static propTypes = {
    endpoint: PropTypes.string.isRequired,
    render: PropTypes.func.isRequired,
    post_data: PropTypes.func

  };
  static defaultProps = {
      post_data: (data) => (data)
  };
  state = {
      data: [],
      loaded: false,
      placeholder: "Loading..."
    };

  componentDidMount() {

      fetch(this.props.endpoint+`?${queryString.stringify({fmt:"json"})}`)
	  .then(response => {
	      if (response.status !== 200) {
		  return this.setState({ placeholder: "Something went wrong" });
		}
              return response.json();
	  })
	  .then(data =>{
	      this.props.post_data(data);
	      this.setState({ data: data, loaded: true });
	  })
  };
	       
  render() {
    const { data, loaded, placeholder } = this.state;
    // const Comp = "Table";
    // return loaded ? this.props.render(data, Comp) : <p>{placeholder}</p>;
    return loaded ? this.props.render(data) : <p>{placeholder}</p>;
  }
}

export default DataProvider;

