import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "bootstrap-icons/font/bootstrap-icons.css";

const root = ReactDOM.createRoot(document.getElementById('root'));

class Note extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hover: false,
            folded: false,
            note: props.notes[props.id],
        }
    }

    hoverOn = () => {
        this.setState({ hover: true });
    }

    hoverOff = () => {
        this.setState({ hover: false });
    }

    toggleFold = () => {
        this.setState((state) => ({ folded: !state.folded }))
    }

    render() {
        return <li className='note'>
            {
                this.state.note.children
                &&
                <button type="button" className="btn btn-link shadow-none fold position-absolute start-0" onClick={this.toggleFold}>
                    {this.state.folded ? "+" : "-"}
                </button>
            }
            <a href='/'>
                <i
                    className={"bi align-middle p-1 " + (this.state.hover ? "bi-circle-fill" : "bi-circle")}
                    onMouseEnter={this.hoverOn}
                    onMouseLeave={this.hoverOff}
                ></i>
            </a>
            sample note {this.props.id}
            {
                !this.state.folded
                &&
                <ul className='list-unstyled'>
                    {this.state.note.children && this.state.note.children.map((id) => <Note key={id.toString()} notes={this.props.notes} id={id} />)}
                </ul>
            }
        </li>
    }
}

class Notes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            notes: {
                1: {
                    children: [2, 3, 4, 5],
                    text: "sample note 1",
                },
                2: {
                    text: "sample note 2",
                    children: [6, 7]
                },
                3: {
                    text: "sample note 3",
                },
                4: {
                    text: "sample note 4",
                },
                5: {
                    text: "sample note 5",
                },
                6: {
                    text: "sample note 5",
                },
                7: {
                    text: "sample note 5",
                },
            },
            rootID: 1,
        };
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
        this.setState((state) => ({
            //notes: [...state.notes, state.notes.length + 1]
        }));
    }

    render() {
        return (
            <div className="container">
                <div className="position-relative ps-2">
                    <ul className='list-unstyled'>
                        <Note notes={this.state.notes} id={this.state.rootID} />
                    </ul>
                </div>
            </div>
        );
    }
}

root.render(<Notes />);