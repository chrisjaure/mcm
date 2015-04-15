import React from 'react';

export default class Loader extends React.Component {
	constructor (props) {
		super(props);
		this.state = { visible: false };
	}
	componentDidMount () {
		this.timer = setTimeout(() => {
			this.setState({ visible: true });
		}, 400);
	}
	render () {
		var opacity = {
			opacity: (this.state.visible) ? 1 : 0
		};
		var classNames = 'loader ' + (this.props.className || '');
		return (
			<div className={classNames} style={opacity}>
				<div className="clock"></div>
			</div>
		);
	}
}