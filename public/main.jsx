//het is handig om eerst het stukje 'gebruikte software' te lezen voor een globale uitleg van React
//componentWillMount() is bij ieder component voor de database referenties die gemaakt moeten worden bij het initialiseren van een component
//functies zonder commentaar zijn voor input velden waarvan de inhoud geupdate moet worden

//database configuratie
const config = {
        authDomain: "whut-9f376.firebaseapp.com",
        databaseURL: "https://whut-9f376.firebaseio.com"
    }
let app = firebase.initializeApp(config);
let db = app.database();

//globale variabelen nodig voor de routing (URL doorverwijzing)
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Link = ReactRouter.Link;
var hashHistory = ReactRouter.hashHistory;

//het overkoepelende component
//{props.children} is waar de sub componenten worden geplaatst
const App = React.createClass({
    render() {
        let noChildren;
        if(this.props.children) { //zorgt dat bij afwezigheid van sub componenten, dus geen specifieke pagina waarop je je bevint, dat het login component wordt laten zien
            noChildren = null;
        } else {
            noChildren = (<Login/>);
        }
        let path = this.props.location.pathname.split('/');
        console.log(path);
        let backArrow;
        if(path[1] === 'student' && path[3] === 'group') {
            backArrow = (
                <input type="button" class="back" value="&#x21D0;" onClick={() => hashHistory.push('student/' + path[2])}/>
            );
        } else if(path[1] === 'teacher' && path[3] === 'group') {
            backArrow = (
                <input type="button" class="back" value="&#x21D0;" onClick={() => hashHistory.push('teacher/' + path[2])}/>
            );
        } else {
            backArrow = (
                <span>?</span>
            );
        }
        return(
            <div>
                <div className="toolbar">
                    {backArrow}
                    <span>Whut</span>
                </div>
                {this.props.children}
                {noChildren}
            </div>
        )
    } 
});

//het component voor het geval dat je op een verkeerde URL zit, met een link naar de login pagina
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

//login component
const Login = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            studentID: "",
            password: ""
        }
    },
    login(e) { //login functie
        if(e) {e.preventDefault()};
        let studentID = this.state.studentID;
        let ref = firebase.database().ref('students');
        ref.once('value', (data) => {
            if(data.hasChild(studentID)) { //checkt of je leerlingnummer al in de database zit (hasChild bij data kijkt dus of er je leerlingnummer een 'kind' van de data is)
                if(data.child(studentID + '/name').val()) { //kijkt of je al een naam hebt ingevoerd
                    hashHistory.push('/student/' + studentID); //je hebt een naam => link naar klassenoverzicht
                } else {
                    hashHistory.push('/' + studentID + '/name'); //je hebt geen naam => link naar scherm om die toe te voegen
                }
            } else {
                this.addStudent(); //je leerlingennummer bestaat niet, hij wordt toevoegd
            }
        });
    },
    addStudent() { //voegt je ingevuld leerlingnummer toe aan de database en roept login opnieuw aan
        console.log('adding ' + this.state.studentID);
        this.firebaseRefs['students'].child(this.state.studentID).set({
            groups: [],
            added: (new Date()).getTime()
        }, (callback) => {
            this.login();
        });
    },
    handleChange(e) {
        this.setState({studentID: e.target.value});
    },
    handlePasswordChange(e) {
        e.preventDefault();
        this.setState({password: e.target.value});
    },
    componentWillMount() {
        let ref = firebase.database().ref('students');
        this.bindAsObject(ref, 'students');
    },
    teacherLogin() { //stuurt je door naar het klassenoverzicht van de docent, TODO: (login voor meerdere docenten komt nog)
        if(this.state.password !== "admin") return;
        let teacherID = 'grj';
        hashHistory.push('/teacher/' + teacherID);
    },
    render() {
        return (
            <div>
             <form onSubmit={this.login}>
              <input type="text" value={this.state.studentID} placeholder="leerlingnummer" onChange={this.handleChange} className="btn"/>
              <input type="submit" value="Login" className="btn"/>
             </form>
             <input type="text" value={this.state.password} placeholder="wachtwoord docent" onChange={this.handlePasswordChange} className="btn"/>
             <button onClick={this.teacherLogin} className="btn">Docent login</button>
            </div>
        )
    }
});

//overzicht voor een scholier waarbij klassen worden weergegeven en toegevoegd kunnen worden
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
        if(e.target.value.length > 7) return;
        this.setState({groupInput: e.target.value});
    },
    test() {
        console.log('---');
        this.state.groups.map((group) => {
            console.log('---' + group['.value']);
            if(group['.value'] == this.state.groupInput) {
                return true;
            }
        });
        return false;
    },
    joinGroup(e) { //voegt een groep ID toe aan je groepen
        e.preventDefault();
        firebase.database().ref('groups/' + this.state.groupInput).once('value', (snapshot) => {
            if(snapshot.val() && !this.test()) { //kijkt of de groep bestaat of niet al toegevoegd is
                this.firebaseRefs['groups'].push(this.state.groupInput); //linkt je naar de vragenform van een groep
            } else { //groep bestaat niet
                alert('Ongeldige groep ID');
            };
        });
    },
    render() {
        let noGroups;
        if(!this.state.groups.length) { //kijkt of er groepen toegevoegd zijn
            noGroups = (<li className="nodatatext">Geen groepen toegevoegd</li>); //verandert het optionele stukje HTML
        }
        return ( 
            <div>
                <h1>Welkom {this.state.name['.value'] || this.props.params.studentID}</h1>
                <ul className="grouplist">
                    {noGroups}
                    {this.state.groups.map((group) => {
                        console.log(group);
                        return (
                            <li key={group['.key']} className="grouplink">
                                <Link to={"student/" + this.props.params.studentID + "/group/" + group['.value']}>{group['.value']}</Link>
                            </li>
                        )
                    })}
                </ul>
                <form onSubmit={this.joinGroup}>
                    <input type="text" value={this.state.groupInput} placeholder="Groep toevoegen" onChange={this.handleChange} className="btn"/>
                    <input type="submit" value="Voeg toe" className="btn"/>
                </form>
            </div>
        )
    }
});

//vragenform voor een student
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
            },
            studentName: ""
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
        let nameRef = firebase.database().ref('students/' + this.props.params.studentID + '/name');
        nameRef.once('value', (data) => {
            this.state.studentName = data.val();
            this.forceUpdate();
        })
    },
    doesObeyScientificNotation(char) {
        console.log(char);
        //let snc = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'e', 'E', '.', ',', '-'];
        let snc = '0123456789eE.,-';
        //let check = false;
        // for(var i=0; i<snc.lenght; i++) {
        //     if(char == snc[i]) {
        //         console.log('check');
        //         check = true;
        //     }
        // }
        if(snc.indexOf(char) > -1) {
            console.log('true');
            return true;
        }
        console.log('false');
        return false;
    },
    handleAssignmentChange(e) {
        e.preventDefault();
        //console.log(parseInt(e.target.value) > 9 || isNan(parseInt(e.target.value.charAt(e.target.value.length-1))));
        //console.log(parseInt(e.target.value).toString().length);
        if(parseInt(e.target.value) > 999 || !this.doesObeyScientificNotation(parseInt(e.target.value.charAt(e.target.value.length)))) return;
        //if(!this.doesObeyScientificNotation(e.target.value.charAt(e.target.value.lenght-1))) return;
        this.state.question.assignment = e.target.value;
        this.forceUpdate();
    },
    handlePartChange(e) {
        e.preventDefault();
        if(e.target.value.length > 1) return;
        this.state.question.part = e.target.value;
        this.forceUpdate();
    },
    handleDescriptionChange(e) {
        if(e.target.value.length > 144) return;
        e.preventDefault();
        this.state.question.description = e.target.value;
        this.forceUpdate();
    },
    pushQuestion(e) { //voegt vraag toe aan de database
        e.preventDefault();
        if(!this.state.question.assignment && !this.state.question.part && !this.state.question.description) {
             return;
        }
        this.firebaseRefs['group'].child('questions').push({
            student: this.props.params.studentID,
            name: this.state.studentName,
            question: this.state.question
        });
        this.setState({question: {assignment: "", part: "", description: ""}});
    },
    removeQuestion(key) { //verwijdert een vraag met een specifieke index
        firebase.database().ref('groups/' + this.props.params.groupID + '/questions').child(key).remove();
    },
    render() { //bij het if-statement worden vragen niet van jou eruit gefilterd
        let noQuestions;
        if(!this.state.questions.length) {
            noQuestions = (<li className="nodatatext">Geen vragen gesteld</li>);
        }
        let groupName = this.state.groupName ? this.state.groupName + ' - ' : '';
        return (
            <div>
                <h1>{groupName + this.props.params.groupID}</h1>
                <ul className="grouplist">
                    {noQuestions}
                    {this.state.questions.map((question, index) => {
                        if(question.student == this.props.params.studentID) {
                            let q = question.question;
                            return (<li key={index} className="litext">
                                        {question.name + ": "}<b>{q.assignment + q.part}</b>{" " + q.description}
                                        <input class="delete" type="button" value="X" onClick={() => {this.removeQuestion(question['.key'])}}/>
                                    </li>);
                        }
                    })}
                </ul>
                <br/>
                <form onSubmit={this.pushQuestion}>
                    <input type="text" value={this.state.question.assignment} placeholder="som" onChange={this.handleAssignmentChange} className="btn"/>
                    <input type="text" value={this.state.question.part} placeholder="A" onChange={this.handlePartChange} className="btn"/>
                    <input type="text" value={this.state.question.description} placeholder="beschrijving" onChange={this.handleDescriptionChange} className="btn"/>
                    <input type="submit" value="Ask" className="btn"/>
                </form>
            </div>
        )
    }
});

//overzicht docent, waar een groep aangemaakt kan worden en aangemaakt groepn worden weergegeven
const TeachterOverview = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            groups: []
        }
    },
    componentWillMount() {
        let groupsRef = firebase.database().ref('groups');
        this.bindAsArray(groupsRef, 'groups');
    },
    checkID(id) { 
        //kijkt of de groep ID niet al eens gebruik is, kan geen kwaad ondank de 10ˆ7 combinaties :), 
        //"Kansen zijn geen feiten. Baseer er dan ook niks op." - Ruben Heek 23/01/2017
        let groupsRef = firebase.database().ref('groups');
        groupsRef.once('value', (snapshot) => {
            if(snapshot.hasChild(id)) {
                this.checkID(this.generateID()); //roept zichzelf aan met een nieuw gegereerde ID, zo wordt dus gecheckt tot de ID uniek is
            } else {
                console.log('adding ' + id);
                this.addGroup(id); //roept functie voor het toevoegen van een groep aan
            }
        });
    },
    generateID() { //genereerd een random ID van 7 cijfers 0-9
        let id = '';
        for(let i=0; i<7; i++) {
            id += Math.floor(Math.random()*10).toString();
        }
        return id;
    },
    addGroup(id) { //maakt een groep aan in de database
        firebase.database().ref('groups').child(id).set({
            owner: this.props.params.teacherID,
            added: (new Date()).getTime()
        }, (callback) => {
            console.log(callback);
            hashHistory.push('/' + this.props.params.teacherID + '/' + id + '/name'); //linkt je door naar scherm om een groepsnaam in te voeren
        });
    },
    createGroup() { //startpunt van groep toevoegen
        this.checkID(this.generateID());    
    },
    removeGroup(key) {
        console.log(key);
        firebase.database().ref('groups/' + key).remove();
    },
    render() {
        let noGroups;
        if(!this.state.groups.length) {
            noGroups = (<li className="nodatatext">Geen groepen aangemaakt</li>);
        }
        return (
            <div>
             <ul className="grouplist">
             {noGroups}
             {this.state.groups.map((group, index) => {
                 let groupLI;
                 console.log(group['.key']);
                 if(group.owner == this.props.params.teacherID) {
                     console.log(group);
                     console.log(index);
                     return (<li key={index} className="grouplink">
                                 <Link to={"teacher/" + this.props.params.teacherID + "/group/" + group['.key']}>{group.name + ' (' + group['.key'] + ")"}</Link>
                                 <input type="button" value="X" onClick={() => {this.removeGroup(group['.key'])}}/>
                            </li>);
                 }
             })}
             </ul>
             <button onClick={this.createGroup} className="btn">Maak klas aan</button>
            </div>
        )
    }
});

//groepsoverizcht docent
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
    },
    removeQuestion(key) { //verwidjert een vraag met de specifieke ID
        firebase.database().ref('groups/'+ this.props.params.groupID + '/questions').child(key).remove();
    },
    render() {
        let noQuestions;
        console.log(this.state.group.questions.length);
        if(!this.state.group.questions.length) {
            noQuestions = (<li className="nodatatext" >Geen vragen</li>);
        }
        let groupName = this.state.group.name ? this.state.group.name + ' - ' : '';
        return (
                <div>
                    <h1>{groupName + this.props.params.groupID}</h1>
                    <ul className="grouplist">
                        {noQuestions}
                        {this.state.questions.map((question, index) => {
                            console.log(question);
                            let q = question.question;
                            return (<li key={index} className="litext">
                                        {question.name + ": "}<b>{q.assignment + q.part}</b>{" " + q.description}
                                        <button type="submit" onClick={() => {this.removeQuestion(question['.key'])}}>X</button>
                                    </li>);
                        })}
                    </ul>
                </div>
        );
    }
});

//compnent om een gebruikersnaam toe te voegen
let addStudentName = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            studentName: ""
        }
    },
    handleSubmit(e) {
        let nameRef = firebase.database().ref('students/' + this.props.params.studentID + '/name'); //linkt je naar gropen overzicht van leerling
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
                    <input type="text" value={this.state.studentName} placeholder="naam" onChange={this.handleChange} className="btn"/>
                    <input type="submit" value="Ga" className="btn"/>
                </form>     
            </div> 
        ); 
    }    
});

//component om  een groepsnaam toe te voegen
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
            console.log('group name changed');
            hashHistory.push('/teacher/' + this.props.params.teacherID + '/group/' + this.props.params.groupID); //linkt je naar groepen overzicht van docent
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
                    <input type="text" placeholder="groepsnaam" onChange={this.handleChange} value={this.state.groupName} className="btn"/>
                    <input type="submit" value="Ga" className="btn"/>
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
            <Route path=":teacherID/:groupID/name" component={addGroupName}/>
            <Route path="login" component={Login}/>
        </Route>
        <Route path="*" component={Default}/>
    </Router>,
    document.getElementById('content'));
