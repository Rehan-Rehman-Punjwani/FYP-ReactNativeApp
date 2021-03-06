import React, { Component, Fragment } from 'react';
import { RNCamera } from 'react-native-camera';
import CameraRoll from "@react-native-community/cameraroll";
import Icon from "react-native-vector-icons/FontAwesome";
import SplashScreen from './splashscreen'
import Thankyou from './thankyou'
const myIcon = (<Icon name = "flash" size={30} style={{color:'#ffffff'}} />);


import {
  StatusBar,
  SafeAreaView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  View,
  Modal,
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  BackHandler ,
  Alert,
  RefreshControl

} from 'react-native'
import BluetoothSerial from 'react-native-bluetooth-serial'
import Toast from 'react-native-tiny-toast'


const Button = ({ title, onPress, style, textStyle }) =>
  <TouchableOpacity style={[ styles.button, style ]} onPress={onPress}>
    <Text style={[ styles.buttonText, textStyle ]}>{title.toUpperCase()}</Text>
  </TouchableOpacity>

const DeviceList = ({ devices, connectedId, showConnectedIcon, onDevicePress,_refreshControl }) =>
<ScrollView 
refreshControl={_refreshControl()}
style={styles.container} >
  <View style={styles.listContainer}>
    
    {devices.map((device, i) => {
      return (
        <TouchableHighlight
          underlayColor='#DDDDDD'
          key={`${device.id}_${i}`}
          style={styles.listItem} onPress={() => onDevicePress(device)}>
          <View style={{ flexDirection: 'row' }}>
            {showConnectedIcon
            ? (
              <View style={{ width: 48, height: 48, opacity: 0.4 }}>
                {connectedId === device.id
                ? (
                  <Image style={{ resizeMode: 'contain', width: 24, height: 24, flex: 1 }} source={require('./Images/ic_done_black_24dp.png')} />
                ) : null}
              </View>
            ) : null}
            <View style={{ justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold' }}>{device.name}</Text>
              {/* <Text>{`<${device.id}>`}</Text> */}
            </View>
          </View>
        </TouchableHighlight>
      )
    })}
  </View>
</ScrollView>

export default class App extends Component{

  constructor (props) {
    super(props)


    this.read = this.read.bind(this);
    this.state = {
      galoption:false,
      isLoading: true,
      photos : [],
      isEnabled: false,
      discovering: false,
      devices: [],
      unpairedDevices: [],
      connected: false,
      section: 0,
      val : false,
      refreshing:false
    }
    let x = <SplashScreen />
  }

   photosession =()=>{

    this.setState(previousState => (
      { val: !previousState.val }
    ))  
  }

  async componentDidMount(){
    console.disableYellowBox = true;
    const data = await this.performTimeConsumingTask();

  if (data !== null) {
    this.setState({ isLoading: false });
  }

    (async function requestStoragePermission() 
    {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            'title': 'Access Request',
            'message': 'AI-Magination require your location access Permissionss'
          }
        )
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("You can use the location")
        } else {
          console.log("location permission denied")
          alert("Location permission denied");
        }
      } catch (err) {
        console.warn(err)
      }
    })();

  }

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    console.log(typeof(this._refreshControl))
  }

  UNSAFE_componentWillMount () {
    BluetoothSerial.withDelimiter('\r').then(() => {
    Promise.all([
      BluetoothSerial.isEnabled(),
      BluetoothSerial.list()
    ])
    .then((values) => {
      const [ isEnabled, devices ] = values
      this.setState({ isEnabled, devices })
    })

    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);

    BluetoothSerial.on('bluetoothEnabled', () => console.log('Bluetooth enabled'))
    BluetoothSerial.on('bluetoothDisabled', () => console.log('Bluetooth disabled'))
    BluetoothSerial.on('read', (data) => {
       if(this.state.val){
         this.takePicture();
       }
   })
    BluetoothSerial.on('error', (err) => console.log(`Error: ${err.message}`))
    BluetoothSerial.on('connectionLost', () => {
      if (this.state.device) {
        console.log(`Connection to device ${this.state.device.name} has been lost`)
      }
      this.setState({ connected: false })
    })
  }); 
  }

  componentWillUnmount(){
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
  }

  _refreshControl=()=>{
    return (
      <RefreshControl
      refreshing={this.state.refreshing}
        onRefresh={()=>this._refreshListView()} />
    )
  }

  _refreshListView(){
    //Start Rendering Spinner
    this.setState({refreshing:true})
    //Updating the dataSource with new data
   
    if(this.state.isEnabled){
      BluetoothSerial.list()
    .then((values) => {
      this.setState({ devices:values })  
    })
    }
    else
    this.setState({devices:[],unpairedDevices:[]})

    this.setState({refreshing:false}) //Stop Rendering Spinner
  }


  onBackPress = () => {
 
    if(this.state.val){
      Alert.alert(
        null,
        ' Do you want to exit Photo Session ?',
        [
          { text: 'Yes', onPress: () =>{ 
  
            if(this.state.val){
              this.disconnect();
              
              this.setState({val:false});
              
              
            }
            
            else
            BackHandler.exitApp();
        
        } },
          { text: 'No', onPress: () => console.log('NO Pressed') }
        ],
        { cancelable: false },
      );
    }
    else{
      Alert.alert(
        null,
        ' Do you want to exit From App ?',
        [
          { text: 'Yes', onPress: () =>{ 
  
            if(this.state.val)
            this.setState({val:false})
            else
            BackHandler.exitApp();
        
        } },
          { text: 'No', onPress: () => console.log('NO Pressed') }
        ],
        { cancelable: false },
      );
    }

 
    // Return true to enable back button over ride.
    return true;
  }

  performTimeConsumingTask = async() => {
    return new Promise((resolve) =>
      setTimeout(
        () => { resolve('result') },
        2000
      )
    );
  }
 

  /**
   * [android]
   * request enable of bluetooth from user
   */
  requestEnable () {
    
    BluetoothSerial.requestEnable()
    .then((res) => this.setState({ isEnabled: true }))
    .then(()=>{
      this.write('start');
      this.photosession();   /************ NEED TO CHECK THIS FUNCTION CALL */
    })
    .catch((err) => Toast.show(err.message))

  }

  /**
   * [android]
   * enable bluetooth on device
   */
  enable () {
    BluetoothSerial.enable()
    .then((res) => this.setState({ isEnabled: true }))
    .catch((err) => Toast.show(err.message))
  }

  /**
   * [android]
   * disable bluetooth on device
   */
  disable () {
    BluetoothSerial.disable()
    .then((res) => this.setState({ isEnabled: false }))
    .catch((err) => Toast.show(err.message))
  }

  /**
   * [android]
   * toggle bluetooth
   */
  toggleBluetooth (value) {
    if (value === true) {
      this.enable()
      this.setState({value:true});

      
    } else {
      this.disable()
      this.setState({value:false});
    }
  }

  /**
   * [android]
   * Discover unpaired devices, works only in android
   */
  discoverUnpaired () {
    if (this.state.discovering) {
      return false
    } else {
      this.setState({ discovering: true })
      BluetoothSerial.discoverUnpairedDevices()
      .then((unpairedDevices) => {
        console.log(unpairedDevices)
        this.setState({ unpairedDevices, discovering: false })
      })
      .catch((err) => Toast.show(err.message))
    }
  }

  /**********************************************************************/

   /**
   * [android]
   * Discover unpaired devices, works only in android
   */
  cancelDiscovery () {
    if (this.state.discovering) {
      BluetoothSerial.cancelDiscovery()
      .then(() => {
        this.setState({ discovering: false })
      })
      .catch((err) => Toast.show(err.message))
    }
  }

  /**
   * [android]
   * Pair device
   */
  pairDevice (device) {
    BluetoothSerial.pairDevice(device.id)
    .then((paired) => {
      if (paired) {
        Toast.show(`Device ${device.name} paired successfully`)
        const devices = this.state.devices
        devices.push(device)
        this.setState({ devices, unpairedDevices: this.state.unpairedDevices.filter((d) => d.id !== device.id) })
      } else {
        Toast.show(`Device ${device.name} pairing failed`)
      }
    })
    .catch((err) => Toast.show(err.message))
  }

  /**
   * Connect to bluetooth device by id
   * @param  {Object} device
   */
  connect (device) {
    
    this.setState({ connecting: true })
    // if(this.state.connecting){
      
    // }
    
    console.log('this is device id ',device.id)
    
    BluetoothSerial.connect(device.id)
    .then((res) => {
      Toast.hide()
      
      Toast.showSuccess(`Connected to device ${device.name}`)
      Toast.show
      
      
      this.setState({ device, connected: true, connecting: false })
    })
    .catch((err) =>{
      Toast.hide();
       Toast.show(err.message);
      });
    
  }

  /**
   * Disconnect from bluetooth device
   */
  disconnect () {
    BluetoothSerial.disconnect()
    .then(() =>{
      Toast.hide();
      Toast.showSuccess("Disconnected")
      this.setState({ connected: false })
    } )
    .catch((err) => Toast.show(err.message))
  }

  /**
   * Toggle connection when we have active device
   * @param  {Boolean} value
   */
  toggleConnect (value) {
    if (value === true && this.state.device) {
      this.connect(this.state.device)
    } else {
      console.log('disconneting')
      Toast.showLoading('Disconnecting...')
      this.disconnect()
    }
  }

  /**
   * Write message to device
   * @param  {String} message
   */
  write (message) {
    if (!this.state.connected) {
      Toast.show('You must connect to device first')
      return;
    }

    BluetoothSerial.write(message)
    .then((res) => {
      console.log('this is ',res)
      //Toast.show('Successfuly wrote to device')
      this.setState({ connected: true })
    }).then((data)=>{
      BluetoothSerial.readFromDevice().then((data) => {
        Toast.show(data)
        console.log(data)});
    })
    .catch((err) => Toast.show(err.message))
  }

//   BluetoothSerial.withDelimiter('\r\n').then((res)=>{
//     BluetoothSerial.on('read', (data) => {
//         console.log('Reading data: ', data)
//     })
// });

  onDevicePress (device) {
    console.log(device)
    console.log(this.state.section)
    if (this.state.section === 0 && !this.state.connected) {
      Toast.showLoading('Connecting...');
      this.connect(device)
      
      
    } 
    else if (this.state.connected){
      console.log('hello');
      Toast.showLoading('Disconnecting...');
      this.disconnect();
    }
    else {
      this.pairDevice(device)
    }
  }

  writePackets (message, packetSize = 64) {
    const toWrite = iconv.encode(message, 'cp852')
    const writePromises = []
    const packetCount = Math.ceil(toWrite.length / packetSize)

    for (var i = 0; i < packetCount; i++) {
      const packet = new Buffer(packetSize)
      packet.fill(' ')
      toWrite.copy(packet, 0, i * packetSize, (i + 1) * packetSize)
      writePromises.push(BluetoothSerial.write(packet))
    }

    Promise.all(writePromises)
    .then((result) => {
    })
  }

  read(){
    BluetoothSerial.readFromDevice().then((data) => {
      console.log(data)
      return data;
    });
  }

  takePicture = async() => {
    if (this.camera) {
      const options = { quality: 0.5,base64: true };
      const data = await this.camera.takePictureAsync(options);
      console.log('taken picture: ',data.uri);
      CameraRoll.saveToCameraRoll(data.uri).
      then(CameraRoll.getPhotos({
        first: 1,
        assetType: 'Photos',
      })
      .then(r => {
        this.setState({ photos: r.edges });
      })
      .catch((err) => {
         console.log(err)
      }));
      // CameraRoll.saveToCameraRoll(data.uri).then((res,err)=>{
      //   if(!err){
      //     console.log('picture has been saved ', res)
      //   }
      //   else{
      //     console.log(err)
      //   }
     // });
    }
  };

  render(){
    if(this.state.galoption){
      return<Thankyou />
    }

    if (this.state.isLoading) {
      return <SplashScreen />;
    }



    if(this.state.val){
      return (
        <View style={styles.container2}>
         
          <RNCamera
            ref={ref => {
              this.camera = ref;
            }}
            style={styles.preview}
            type={RNCamera.Constants.Type.back}
            // flashMode={RNCamera.Constants.FlashMode.on}
            playSoundOnCapture={true}
            androidCameraPermissionOptions={{
              title: 'Permission to use camera',
              message: 'We need your permission to use your camera',
              buttonPositive: 'Ok',
              buttonNegative: 'Cancel',
            }}
          />   
        </View>
      );
    }



    else{
        const activeTabStyle = { borderBottomWidth: 6, borderColor: '#009688' }
        return (
          <View style={{ flex: 1 }}>
            <View style={styles.topBar}>
              <Text style={styles.heading}>AiMagenation</Text>
              
              {Platform.OS === 'android'
              ? (
                <View style={styles.enableInfoWrapper}>
                  <Text style={{ fontSize: 12, color: '#FFFFFF' }}>
                    {this.state.isEnabled ? 'disable Bluetooth' : 'enable Bluetooth'}
                  </Text>
                  <Switch
                    onValueChange={this.toggleBluetooth.bind(this)}
                    value={this.state.isEnabled} />
                </View>
              ) : null}
            </View>
    
            {Platform.OS === 'android'
            ? (
              <View style={[styles.topBar, { justifyContent: 'center', paddingHorizontal: 0 }]}>
                <TouchableOpacity style={[styles.tab, this.state.section === 0 && activeTabStyle]} onPress={() => this.setState({ section: 0 })}>
                  <Text style={{ fontSize: 14, color: '#FFFFFF' }}>PAIRED DEVICES</Text>
                  
                </TouchableOpacity>
                {/* <TouchableOpacity style={[styles.tab, this.state.section === 1 && activeTabStyle]} onPress={() => this.setState({ section: 1 })}>
                  <Text style={{ fontSize: 14, color: '#FFFFFF' }}>UNPAIRED DEVICES</Text>
                </TouchableOpacity> */} 
              </View>

            ) : null}

            {/* {
              this.state.isEnabled==false && this.state.section==0
              ?(
                <View>
                 
                <Text style={{textAlign:'center', paddingTop:'50%'}}>Please Enabel Bluetooth to see paired Devices</Text>
                
                </View>
              ):null} */}

            {/* {
              this.state.isEnabled==true && this.state.section==0 && this.state.devices.length==0
              ?(
                <Text style={{textAlign:'center', paddingTop:'50%'}}>You did not pair any device</Text>
              ):null}

            {
              this.state.isEnabled==false && this.state.section==1 && this.state.discovering == false
              ?(
                <Text style={{textAlign:'center', paddingTop:'50%'}}>Please Enabel Bluetooth </Text>
              ):null}
 */}

            {this.state.discovering && this.state.section === 1 && this.state.isEnabled==true
            ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    
                  <ActivityIndicator
                    style={{ marginBottom: 15 }}
                    size={60} />
                    
                  <Button
                    textStyle={{ color: '#FFFFFF' }}
                    style={styles.buttonRaised}
                    title='Cancel Discovery'
                    onPress={() => this.cancelDiscovery()} />
                
                

                </View>
            ) : (

              <Fragment>
                <DeviceList
                  devices={this.state.section === 0 ? this.state.devices : this.state.unpairedDevices}
                  connectedId={this.state.device && this.state.device.id}
                  showConnectedIcon={this.state.section === 0}
                  onDevicePress={(device) => this.onDevicePress(device)} 
                  
                  _refreshControl={this._refreshControl}/>

                <Button
                      title='Start Photo Session'
                      onPress={() => this.requestEnable()} />
              </Fragment>
            )}

              
     
            <View style={{ alignSelf: 'flex-end', height: 52 }}>

              <ScrollView
                horizontal
                contentContainerStyle={styles.fixedFooter}>
                {Platform.OS === 'android' && this.state.section === 1
                ? (
                  <Button
                    title={this.state.discovering ? '... Discovering' : 'Discover devices'}
                    onPress={this.discoverUnpaired.bind(this)} />
                ) : null}
                {/* {Platform.OS === 'android' && !this.state.isEnabled
                ? (
                  // <Button
                  //   title='Start Photo Session'
                  //   onPress={() => this.requestEnable()} />
                ) : null} */}
              </ScrollView>
  
            </View>
          
          </View>
        )
    }
      
        // <View>
        //   <Text>HELLLO THERE</Text>
        //   <Button onPress={this.photosession} title="Start Your Photo Session" />
        // </View>
     
    }

  }

  const styles = StyleSheet.create({
    container: {
      flex: 0.9,
      //backgroundColor: '#00BCD4'
    },
    topBar: { 
      height: 56, 
      paddingHorizontal: 16,
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center' ,
      elevation: 6,
      backgroundColor: '#7B1FA2'
    },
    heading: {
      fontWeight: 'bold',
      fontSize: 16,
      alignSelf: 'center',
      color: '#FFFFFF'
    },
    enableInfoWrapper: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    tab: { 
      alignItems: 'center', 
      flex: 0.5, 
      height: 56, 
      justifyContent: 'center', 
      borderBottomWidth: 6, 
      borderColor: 'transparent' 
    },
    connectionInfoWrapper: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 25
    },
    connectionInfo: {
      fontWeight: 'bold',
      alignSelf: 'center',
      fontSize: 18,
      marginVertical: 10,
      color: '#238923'
    },
    listContainer: {
      borderColor: '#009688',
      borderTopWidth: 0.5
    },
    listItem: {
      flex: 1,
      height: 48,
      paddingHorizontal: 16,
      borderColor: '#ccc',
      borderBottomWidth: 0.5,
      justifyContent: 'center'
    },
    fixedFooter: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#ddd'
    },
    button: {
      height: 36,
      margin: 5,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center'
    },
    buttonText: {
      color: '#7B1FA2',
      fontWeight: 'bold',
      fontSize: 14
    },
    buttonRaised: {
      backgroundColor: '#7B1FA2',
      borderRadius: 2,
      elevation: 2
    },

    container2: {
      flex: 1,
      flexDirection: 'column',
      backgroundColor: 'black',
    },
    preview: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    capture: {
      flex: 0,
      backgroundColor: '#fff',
      borderRadius: 5,
      padding: 15,
      paddingHorizontal: 20,
      alignSelf: 'center',
      margin: 20,
    },
  })
  