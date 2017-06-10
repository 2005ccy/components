import React from 'react';

export default class Div extends Component {

    render() {
        return (<div dangerouslySetInnerHTML={ { __html: this.props.children } }></div>);
    }
}
