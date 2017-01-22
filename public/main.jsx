// import React from 'react';
// import reactDOM from 'react-dom';
// import firebase from 'firebase';
// import reactfire from 'reactfire';
// import {Router, Route, Link, hashHistory} from 'react-router';

const config = {
        authDomain: "whut-9f376.firebaseapp.com",
        databaseURL: "https://whut-9f376.firebaseio.com"
    }
let app = firebase.initializeApp(config);
let db = app.database();

var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Link = ReactRouter.Link;
var hashHistory = ReactRouter.hashHistory;

const App = React.createClass({
    render() {
        console.log(this.props.children);
        let noChildren;
        if(this.props.children) {
            noChildren = null;
        } else {
            noChildren = (<Login/>);
        }
        return(
            <div>
                <div className="toolbar">
                    <span>? App 2</span>
                    <span></span>
                </div>
                {this.props.children}
                {noChildren}
            </div>
        )
    }
});

const Default = React.createClass({
    render() {
        return(
            <div>
             <p>No match</p>
             <Link to="/login">login</Link>
            </div>
        )
    }
});

//login form
const Login = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            studentID: ""
        }
    },
    login(e) {
        if(e) {e.preventDefault()};
        let studentID = this.state.studentID;
        let ref = firebase.database().ref('students');
        ref.once('value', (data) => {
            console.log('---');
            console.log(data.child(studentID + '/name').val());
            console.log(data.hasChild(studentID));
            if(data.hasChild(studentID)) {
                if(data.child(studentID + '/name').val()) {
                    hashHistory.push('/student/' + studentID);
                } else {
                    console.log('name forward');
                    hashHistory.push('/' + studentID + '/name');
                }
            } else {
                console.log('adding student');
                this.addStudent()
            }
        });
    },
    addStudent() {
        console.log('adding ' + this.state.studentID);
        this.firebaseRefs['students'].child(this.state.studentID).set({
            groups: [],
            added: (new Date()).getTime()
        }, (callback) => {
            console.log(callback);
            this.login();
        });
    },
    handleChange(e) {
        this.setState({studentID: e.target.value});
    },
    componentWillMount() {
        let ref = firebase.database().ref('students');
        this.bindAsObject(ref, 'students');
    },
    teacherLogin() {
        let teacherID = 'grj';
        hashHistory.push('/teacher/' + teacherID);
    },
    render() {
        return (
            <div>
             <form onSubmit={this.login}>
              <input type="text" value={this.state.studentID} placeholder="leerlingnummer" onChange={this.handleChange}/>
              <input type="submit" value="Login"/>
             </form>
             <button onClick={this.teacherLogin}>Docent login</button>
            </div>
        )
    }
});

//overview for student with groups added
const StudentOverview = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            groups: [],
            name: {},
            groupInput: ''
        }
    },
    componentWillMount() {
        let groupsRef = firebase.database().ref('students/' + this.props.params.studentID + '/groups');
        this.bindAsArray(groupsRef, 'groups');
        let nameRef = firebase.database().ref('students/' + this.props.params.studentID + '/name');
        this.bindAsObject(nameRef, 'name');
    },
    handleChange(e) {
        this.setState({groupInput: e.target.value});
    },
    joinGroup(e) {
        e.preventDefault();
        firebase.database().ref('groups/' + this.state.groupInput).once('value', (snapshot) => {
            console.log(snapshot.val());
            if(snapshot.val()) {
                console.log(snapshot.val());
                this.firebaseRefs['groups'].push(this.state.groupInput);
                //hashHistory.push('/student/' + this.props.params.studentID + '/group/' + this.state.groupInput);
            } else {
                alert('Ongeldige groep ID');
            };
        });
    },
    render() {
        let noGroups;
        console.log(this.state.groups);
        if(!this.state.groups.length) {
            noGroups = (<li>Not enrolled in any groups yet</li>);
        }
        return ( 
            <div>
                <p>Welkom {this.state.name['.value'] || this.props.params.studentID}</p>
                <span>Groups</span>
                <ul>
                    {noGroups}
                    {this.state.groups.map((group) => {
                        console.log(group);
                        return (
                            <li key={group['.key']}>
                                <Link to={"student/" + this.props.params.studentID + "/group/" + group['.value']}>{group['.value']}</Link>
                            </li>
                        )
                    })}
                </ul>
                <form onSubmit={this.joinGroup}>
                    <input type="text" value={this.state.groupInput} placeholder="Groep toevoegen" onChange={this.handleChange}/>
                    <input type="submit" value="Voeg toe"/>
                </form>
            </div>
        )
    }
});

//question form
const GroupForm = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            group: {
                questions: []
            },
            groupName: "",
            questions: [],
            question: {
                assignment: "",
                part: "",
                description: ""
            }
        }
    },
    componentWillMount() {
        let groupRef = firebase.database().ref('groups/' + this.props.params.groupID);
        this.bindAsObject(groupRef, 'group');
        let questionsRef = firebase.database().ref('groups/' + this.props.params.groupID + '/questions');
        this.bindAsArray(questionsRef, 'questions');
        firebase.database().ref('groups/' + this.props.params.groupID + '/name').on('value', (data) => {
            this.state.groupName = data.val();
            this.forceUpdate();
        });
        questionsRef.on('child_removed', (data) => {
            console.log(data);
            console.log('removed');
        });
    },
    handleAssignmentChange(e) {
        e.preventDefault();
        this.state.question.assignment = e.target.value;
        this.forceUpdate();
    },
    handlePartChange(e) {
        e.preventDefault();
        this.state.question.part = e.target.value;
        this.forceUpdate();
    },
    handleDescriptionChange(e) {
        e.preventDefault();
        this.state.question.description = e.target.value;
        this.forceUpdate();
    },
    pushQuestion(e) {
        e.preventDefault();
        if(!this.state.question.assignment && !this.state.question.part && !this.state.question.description) {
             return;
        }
        this.firebaseRefs['group'].child('questions').push({
            student: this.props.params.studentID,
            question: this.state.question
        });
        this.setState({question: {assignment: "", part: "", description: ""}});
    },
    removeQuestion(key) {
        firebase.database().ref('groups/' + this.props.params.groupID + '/questions').child(key).remove();
    },
    render() {
        let noQuestions;
        if(!this.state.questions) {
            noQuestions = (<li>No questions asked yet</li>);
        }
        let groupName = this.state.groupName ? this.state.groupName + ' - ' : '';
        return (
            <div>
                <h1>{groupName + this.props.params.groupID}</h1>
                <span>Questions</span>
                <lu>
                    {noQuestions}
                    {this.state.questions.map((question, index) => {
                        if(question.student == this.props.params.studentID) {
                            let q = question.question;
                            return (<li key={index}>
                                        {question.student + ": "}<b>{q.assignment + q.part}</b>{" " + q.description}
                                        <button type="submit" onClick={() => {this.removeQuestion(question['.key'])}}>X</button>
                                    </li>);
                        }
                    })}
                </lu>
                <br/>
                <form onSubmit={this.pushQuestion}>
                    <input type="number" value={this.state.question.assignment} placeholder="som" onChange={this.handleAssignmentChange}/>
                    <input type="text" value={this.state.question.part} placeholder="A" onChange={this.handlePartChange}/>
                    <input type="text" value={this.state.question.description} placeholder="beschrijving" onChange={this.handleDescriptionChange}/>
                    <input type="submit" value="Ask"/>
                </form>
            </div>
        )
    }
});

//teacher overview
const TeachterOverview = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            groups: []
        }
    },
    checkID(id) {
        let groupsRef = firebase.database().ref('groups');
        groupsRef.once('value', (snapshot) => {
            if(snapshot.hasChild(id)) {
                this.checkID(this.generateID());
            } else {
                console.log('adding ' + id);
                this.addGroup(id);
            }
        });
    },
    generateID() {
        let id = '';
        for(let i=0; i<7; i++) {
            id += Math.floor(Math.random()*10).toString();
        }
        return id;
    },
    addGroup(id) {
        firebase.database().ref('groups').child(id).set({
            owner: this.props.params.teacherID,
            added: (new Date()).getTime()
        }, (callback) => {
            console.log(callback);
            hashHistory.push('/' + this.props.params.teacherID + '/' + id + '/name');
        });
    },
    createGroup() {
        this.checkID(this.generateID());    
    },
    componentWillMount() {
        let groupsRef = firebase.database().ref('groups');
        this.bindAsArray(groupsRef, 'groups');
    },
    render() {
        return (
            <div>
             {this.state.groups.map((group, index) => {
                 let groupLI;
                 console.log(group['.key']);
                 if(group.owner == this.props.params.teacherID) {
                     return (<li key={index}>
                                 <Link to={"teacher/" + this.props.params.studentID + "/group/" + group['.key']}>{group['.key']}</Link>
                                </li>);
                 }
             })}
             <button onClick={this.createGroup}>Maak klas aan</button>
            </div>
        )
    }
});

//teacher group overview
const GroupOverview = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            group: {
                name: "",
                questions: []
            }
        }
    },
    componentWillMount() {
        let questionsRef = firebase.database().ref('groups/' + this.props.params.groupID + '/questions');
        this.bindAsArray(questionsRef, 'questions');
        firebase.database().ref('groups/' + this.props.params.groupID + '/name').on('value', (data) => {
            console.log(data.val());
            this.state.group.name = data.val();
            this.forceUpdate();
        });
        questionsRef.on('child_removed', (data) => {
            console.log(data);
            console.log('removed');
        });
    },
    removeQuestion(key) {
        firebase.database().ref('groups/'+ this.props.params.groupID + '/questions').child(key).remove();
    },
    render() {
        let noQuestions;
        if(!this.state.questions.length) {
            noQuestions = (<li>No questions asked yet</li>);
        }
        let groupName = this.state.group.name ? this.state.group.name + ' - ' : '';
        return (
                <div>
                    <h1>{groupName + this.props.params.groupID}</h1>
                    <span>Questions</span>
                    <lu>
                        {noQuestions}
                        {this.state.questions.map((question, index) => {
                            console.log(question);
                            let q = question.question;
                            return (<li key={index}>
                                        {question.student + ": "}<b>{q.assignment + q.part}</b>{" " + q.description}
                                        <button type="submit" onClick={() => {this.removeQuestion(question['.key'])}}>X</button>
                                    </li>);
                        })}
                    </lu>
                </div>
        );
    }
});

//add student name
let addStudentName = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            studentName: ""
        }
    },
    handleSubmit(e) {
        let nameRef = firebase.database().ref('students/' + this.props.params.studentID + '/name');
        nameRef.set(this.state.studentName).then(() => {
            console.log('name changed');
            hashHistory.push('/student/' + this.props.params.studentID);
        });
    },
    handleChange(e) {
        e.preventDefault();
        this.setState({studentName: e.target.value});
    },
    render() {
        return(
            <div>
                <form onSubmit={this.handleSubmit}>
                    <input type="text" value={this.state.studentName} placeholder="naam" onChange={this.handleChange}/>
                    <input type="submit" value="Ga"/>
                </form>     
            </div> 
        ); 
    }    
});

//add group name
let addGroupName = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            groupName: ""
        }
    },
   handleSubmit(e) {
        e.preventDefault();
        let nameRef = firebase.database().ref('groups/' + this.props.params.groupID + '/name');
        nameRef.set(this.state.groupName).then((callback) => {
            console.log(callback);
            console.log('group name changed');
            hashHistory.push('/teacher/'+ this.props.params.teacherID + '/group/' + this.props.params.groupID)
        });
    },
    handleChange(e) {
        e.preventDefault();
        this.setState({groupName: e.target.value});
    },
    render() {
        return(
            <div>
                <form onSubmit={this.handleSubmit}>
                    <input type="text" placeholder="groepsnaam" onChange={this.handleChange} value={this.state.groupName}/>
                    <input type="submit" value="Ga"/>
                </form>
            </div>
        );  
    }
});

//routing
ReactDOM.render(
    <Router history={hashHistory}>
        <Route path="/" component={App}>
            <Route path="student/:studentID" component={StudentOverview}/>
            <Route path="student/:studentID/group/:groupID" component={GroupForm}/>
            <Route path=":studentID/name" component={addStudentName}/>
            <Route path="teacher/:teacherID" component={TeachterOverview}/>
            <Route path="teacher/:teacherID/group/:groupID" component={GroupOverview}/>
            <Route path=":teachterID/:groupID/name" component={addGroupName}/>
            <Route path="login" component={Login}/>
        </Route>
        <Route path="*" component={Default}/>
    </Router>,
    document.getElementById('content'));