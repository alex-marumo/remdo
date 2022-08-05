import React from 'react';
import "./Notes.css"

function Note(props) {
    const [hover, setHover] = React.useState(false);
    const [folded, setFolded] = React.useState(false);
    const note = props.notes[props.id];

    return (<li className='note'>
        {
            note.children
            &&
            <button type="button" className="btn btn-link shadow-none fold position-absolute start-0" onClick={() => setFolded(!folded)}>
                {folded ? "+" : "-"}
            </button>
        }
        <a href='/'>
            <i
                className={"bi align-middle p-1 " + (hover ? "bi-circle-fill" : "bi-circle")}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            ></i>
        </a>
        {note.text}
        {
            !folded
            &&
            <ul className='list-unstyled'>
                {note.children && note.children.map((id) => <Note key={id.toString()} notes={props.notes} id={id} />)}
            </ul>
        }
    </li>)
}

function Notes(props) {
    const [notes, setNotes] = React.useState({
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
    });
    let rootID = 1;
    return (
        <div className="container">
            <div className="position-relative ps-2">
                <ul className='list-unstyled'>
                    <Note notes={notes} id={rootID} />
                </ul>
            </div>
        </div>
    );
}

export default Notes;
