import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

class Clock extends React.Component {
    constructor(props) {
      super(props);
      this.state = {date: new Date()};
    }
  
    componentDidMount() {
      this.timerID = setInterval(
        () => this.tick(),
        1000
      );
    }
  
    componentWillUnmount() {
      clearInterval(this.timerID);
    }
  
    tick() {
      this.setState({
        date: new Date()
      });
    }
  
    render() {
      return (
        <div>
          <h1>Hello, world!</h1>
          <h2>It is {this.state.date.toLocaleTimeString()}.</h2>
        </div>
      );
    }
  }

root.render(<Clock />);

/*
let counter = 0;

setInterval(function () {
    counter += 1;
    root.render(<ul>
        <li><Welcome name={counter} /></li>
        <li><Welcome name={counter+1} /></li>
        <li><Welcome name={counter+2} /></li>
    </ul>);
}, 1000);
*/