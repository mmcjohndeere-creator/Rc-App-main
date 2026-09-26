import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  Image,
  ActionSheetIOS,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'react-native-camera-kit';

const Rcinternalpage = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingFormId, setExistingFormId] = useState(null);
  const [existingFormNo, setExistingFormNo] = useState(null);
  const [status, setStatus] = useState('pending');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Form states
  const [rcIssued, setRcIssued] = useState('yes');
  const [noPlateIssued, setNoPlateIssued] = useState('yes');
  const [tractorOwner, setTractorOwner] = useState('yes');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // QR Scanner States
  const [showChassisScanner, setShowChassisScanner] = useState(false);
  const [showEngineScanner, setShowEngineScanner] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);

  // Additional states
  const [showHypoDropdown, setShowHypoDropdown] = useState(false);
  const [hypothecationOptions] = useState([
    'John Deere Financial India Private Limited',
    'The Jammu and Kashmir Bank Limited',
    'Nil',
    'Other',
  ]);
  const [hypothecationOther, setHypothecationOther] = useState('');
  const [showRcDatePicker, setShowRcDatePicker] = useState(false);
  const [showPlateDatePicker, setShowPlateDatePicker] = useState(false);
  const [rcIssueDate, setRcIssueDate] = useState(null);
  const [plateIssueDate, setPlateIssueDate] = useState(null);
  const [rcNoText, setRcNoText] = useState('');
  const [plateNoText, setPlateNoText] = useState('');
  const [showRelationDropdown, setShowRelationDropdown] = useState(false);
  const [relationOptions] = useState([
    'Father', 'Mother', 'Friend', 'Spouse', 'Brother', 'Sister', 'Son', 'Other'
  ]);
  const [relationOther, setRelationOther] = useState('');
  const [ownerDetails, setOwnerDetails] = useState({
    ownerName: '',
    ownerFatherName: '',
    ownerAddress: '',
    ownerMobile: '',
    ownerRelation: '',
  });

  // New states for the three options
  const [agricultureCertificate, setAgricultureCertificate] = useState('yes');
  const [agricultureOther, setAgricultureOther] = useState('');
  const [customerAffidavit, setCustomerAffidavit] = useState('yes');
  const [affidavitOther, setAffidavitOther] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  const [formData, setFormData] = useState({
    employeeName: '',
    customerName: '',
    percentage: '',
    address: '',
    mobileNo: '',
    registrationNo: '',
    tractorModel: '',
    date: null,
    hypothecation: '',
    chassisNo: '',
    pvcCardNo: '',
    engineNo: '',
  });

  // Image states
  const [customerPhoto, setCustomerPhoto] = useState(null);
  const [customerSignature, setCustomerSignature] = useState(null);
  const [managerSignature, setManagerSignature] = useState(null);

  const tractorModels = [
    "3028EN",
    "3036EN", 
    "3036E",
    "5105",
    "5105 4WD",
    "5050D Gear Pro",
    "5210 Gear Pro",
    "5050D 4WD Gear Pro",
    "5210 4WD Gear Pro",
    "5310 CRDI",
    "5310 4WD CRDI",
    "5405 CRDI",
    "5405 4WD CRDI",
    "5075 2WD",
    "5075 4WD"
  ];

  // Helper function to make absolute URLs
  const makeAbsoluteUrl = (relativePath) => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;
    return `https://makroomotors.com/makroo-panel/public/${relativePath.replace(/^\/+/, '')}`;
  };

  // Get form ID from route params and fetch data
  useEffect(() => {
    const getUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.log('Error loading user data:', error);
      }
    };

    getUserData();

    const formId = route.params?.formId;
    if (formId) {
      setExistingFormId(formId);
      fetchFormData(formId);
    } else {
      Alert.alert('Error', 'No form ID provided');
      navigation.goBack();
    }
  }, [route.params]);

  const fetchFormData = async (formId) => {
    try {
      setFetchLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append('id', formId.toString());

      const config = {
        method: 'post',
        url: 'https://makroomotors.com/makroo-panel/public/api/v1/rc-no-plate-delivery/form/get',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        data: formDataToSend,
        timeout: 30000,
      };

      const response = await axios(config);
      
      if (response.data.status && response.data.data) {
        const data = response.data.data;
        
        // Set status from backend
        setStatus(data.status || 'pending');
        
        setExistingFormNo(data.form_no);
        
        // Populate all form fields
        populateFormData(data);
      } else {
        Alert.alert('Error', 'Failed to fetch form data');
      }
    } catch (error) {
      console.log('Fetch Error:', error);
      Alert.alert('Error', 'Failed to load form data');
    } finally {
      setFetchLoading(false);
    }
  };

  const populateFormData = (data) => {
    // Basic form data
    setFormData({
      employeeName: data.employee_name || '',
      customerName: data.customer_name || '',
      percentage: data.percentage || '',
      address: data.address || '',
      mobileNo: data.mobile_no || '',
      registrationNo: data.registration_no || '',
      tractorModel: data.tractor_model || '',
      date: data.select_date ? new Date(data.select_date) : null,
      hypothecation: data.hypothecation || '',
      chassisNo: data.chassis_no || '',
      pvcCardNo: data.pvc_card_no || '',
      engineNo: data.engine_no || '',
    });

    // Radio button states
    setRcIssued(data.rc_issued?.toLowerCase() === 'no' ? 'no' : 'yes');
    setNoPlateIssued(data.plate_issued?.toLowerCase() === 'no' ? 'no' : 'yes');
    setTractorOwner(data.tractor_owner?.toLowerCase() === 'no' ? 'no' : 'yes');

    // New fields
    setAgricultureCertificate(
      data.agriculture_certificate?.toLowerCase() === 'no' ? 'no' : 
      data.agriculture_certificate?.toLowerCase() === 'other' ? 'other' : 'yes'
    );
    setAgricultureOther(data.agriculture_certificate_other || '');

    setCustomerAffidavit(
      data.customer_affidavit?.toLowerCase() === 'no' ? 'no' : 
      data.customer_affidavit?.toLowerCase() === 'other' ? 'other' : 'yes'
    );
    setAffidavitOther(data.customer_affidavit_other || '');

    setPaymentStatus(
      data.payment_status?.toLowerCase() === 'balance' ? 'balance' : 
      data.payment_status?.toLowerCase() === 'remarks' ? 'remarks' : 'paid'
    );
    setPaymentRemarks(data.payment_status_remark || '');

    // RC fields
    if (data.rc_issued_at) {
      setRcIssueDate(new Date(data.rc_issued_at));
    }
    if (data.rc_issue_no) {
      setRcNoText(data.rc_issue_no);
    }

    // Plate fields
    if (data.plate_issued_at) {
      setPlateIssueDate(new Date(data.plate_issued_at));
    }
    if (data.plate_issue_no) {
      setPlateNoText(data.plate_issue_no);
    }

    // Hypothecation
    if (data.hypothecation === 'Other' && data.hypothecation_other) {
      setHypothecationOther(data.hypothecation_other);
    }

    // Owner details if tractor owner is No
    if (data.tractor_owner === 'No') {
      setOwnerDetails({
        ownerName: data.relative_name || '',
        ownerFatherName: data.relative_father_name || '',
        ownerAddress: data.relative_address || '',
        ownerMobile: data.relative_phone || '',
        ownerRelation: data.relative_relation || '',
      });
      if (data.relative_relation === 'Other' && data.relation_other) {
        setRelationOther(data.relation_other);
      }
    }

    // Load existing images
    if (data.customer_photo) {
      const customerPhotoUri = makeAbsoluteUrl(data.customer_photo);
      setCustomerPhoto(customerPhotoUri);
    }
    if (data.customer_signature) {
      const customerSignatureUri = makeAbsoluteUrl(data.customer_signature);
      setCustomerSignature(customerSignatureUri);
    }
    if (data.manager_signature) {
      const managerSignatureUri = makeAbsoluteUrl(data.manager_signature);
      setManagerSignature(managerSignatureUri);
    }

    // Accept terms for viewing
    setAcceptedTerms(true);
  };

  // Camera Permission Function
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "This app needs access to your camera to scan QR codes.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasCameraPermission(hasPermission);
        return hasPermission;
      } catch (err) {
        console.warn(err);
        setHasCameraPermission(false);
        return false;
      }
    }
    setHasCameraPermission(true);
    return true;
  };

  // QR Scanner Handlers
  const handleChassisScanPress = async () => {
    if (!isEditMode) return;
    const hasPermission = await requestCameraPermission();
    if (hasPermission) {
      setShowChassisScanner(true);
    } else {
      Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes.');
    }
  };

  const handleEngineScanPress = async () => {
    if (!isEditMode) return;
    const hasPermission = await requestCameraPermission();
    if (hasPermission) {
      setShowEngineScanner(true);
    } else {
      Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes.');
    }
  };

  const handleQRCodeRead = (event) => {
    const scannedValue = event.nativeEvent.codeStringValue;
    console.log('QR Code Scanned:', scannedValue);
    
    if (showChassisScanner) {
      handleInputChange('chassisNo', scannedValue);
      setShowChassisScanner(false);
    } else if (showEngineScanner) {
      handleInputChange('engineNo', scannedValue);
      setShowEngineScanner(false);
    }
  };

  const closeScanner = () => {
    setShowChassisScanner(false);
    setShowEngineScanner(false);
  };

  // Image handling functions
  const requestCameraPermissionForImage = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "This app needs access to your camera to take photos.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const showImageSourceOptions = (setImageFunction, title = 'Select Image Source') => {
    if (!isEditMode) {
      Alert.alert('Cannot Edit', 'This form cannot be edited in its current status.');
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            const hasPermission = await requestCameraPermissionForImage();
            if (!hasPermission) {
              Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
              return;
            }
            openCamera(setImageFunction);
          } else if (buttonIndex === 2) {
            openGallery(setImageFunction);
          }
        }
      );
    } else {
      Alert.alert(
        title,
        'Choose how you want to capture the image',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Take Photo', 
            onPress: async () => {
              const hasPermission = await requestCameraPermissionForImage();
              if (!hasPermission) {
                Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
                return;
              }
              openCamera(setImageFunction);
            } 
          },
          { 
            text: 'Choose from Gallery', 
            onPress: () => openGallery(setImageFunction) 
          },
        ]
      );
    }
  };

  const openCamera = (setImageFunction) => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      cameraType: 'back',
      saveToPhotos: false,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.error) {
        console.log('Camera Error: ', response.error);
        Alert.alert('Error', 'Failed to capture image');
      } else if (response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri;
        setImageFunction(uri);
      }
    });
  };

  const openGallery = (setImageFunction) => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to pick image');
      } else if (response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri;
        setImageFunction(uri);
      }
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePercentageChange = (text) => {
    const filtered = text.replace(/[^a-zA-Z\s]/g, '');
    handleInputChange('percentage', filtered);
  };

  const handleModelSelect = (model) => {
    handleInputChange('tractorModel', model);
    setShowModelDropdown(false);
  };

  const handleHypoSelect = (option) => {
    if (option === 'Other') {
      handleInputChange('hypothecation', 'Other');
      setHypothecationOther('');
      setShowHypoDropdown(false);
    } else {
      handleInputChange('hypothecation', option);
      setHypothecationOther('');
      setShowHypoDropdown(false);
    }
  };

  const handleRelationSelect = (option) => {
    if (option === 'Other') {
      setOwnerDetails(prev => ({...prev, ownerRelation: 'Other'}));
      setRelationOther('');
      setShowRelationDropdown(false);
    } else {
      setOwnerDetails(prev => ({...prev, ownerRelation: option}));
      setRelationOther('');
      setShowRelationDropdown(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('date', selectedDate);
    }
  };

  const handleRcDateChange = (event, selectedDate) => {
    setShowRcDatePicker(false);
    if (selectedDate) {
      setRcIssueDate(selectedDate);
    }
  };

  const handlePlateDateChange = (event, selectedDate) => {
    setShowPlateDatePicker(false);
    if (selectedDate) {
      setPlateIssueDate(selectedDate);
    }
  };

  // Edit Mode Handler - Only allow editing when backend status is 'edited'
  const handleEditPress = () => {
    const backendStatus = route.params?.backendStatus || 'pending';
    
    if (backendStatus === 'edited') {
      setIsEditMode(true);
    } else {
      Alert.alert('Cannot Edit', 'This form cannot be edited in its current status.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    if (existingFormId) {
      fetchFormData(existingFormId);
    }
  };

  // Validate Form for Update
  const validateForm = () => {
    const requiredFields = [
      'employeeName', 'customerName', 'percentage', 'address', 
      'mobileNo', 'registrationNo', 'tractorModel',
      'chassisNo', 'engineNo'
    ];

    for (const field of requiredFields) {
      if (!formData[field] || formData[field].toString().trim() === '') {
        Alert.alert('Validation Error', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    if (!formData.hypothecation || formData.hypothecation.trim() === '') {
      Alert.alert('Validation Error', 'Please select hypothecation');
      return false;
    }

    if (formData.hypothecation === 'Other' && (!hypothecationOther || hypothecationOther.trim() === '')) {
      Alert.alert('Validation Error', 'Please enter hypothecation details for Other');
      return false;
    }

    if (agricultureCertificate === 'no') {
      Alert.alert('Validation Error', 'Form cannot be submitted when Agriculture Certificate is No');
      return false;
    }
    if (agricultureCertificate === 'other' && (!agricultureOther || agricultureOther.trim() === '')) {
      Alert.alert('Validation Error', 'Please enter Agriculture Certificate details for Other');
      return false;
    }

    if (customerAffidavit === 'no') {
      Alert.alert('Validation Error', 'Form cannot be submitted when Customer Affidavit is No');
      return false;
    }
    if (customerAffidavit === 'other' && (!affidavitOther || affidavitOther.trim() === '')) {
      Alert.alert('Validation Error', 'Please enter Customer Affidavit details for Other');
      return false;
    }

    if (paymentStatus === 'balance') {
      Alert.alert('Validation Error', 'Form cannot be submitted when Payment Status is Balance');
      return false;
    }
    if (paymentStatus === 'remarks' && (!paymentRemarks || paymentRemarks.trim() === '')) {
      Alert.alert('Validation Error', 'Please enter Payment Status remarks');
      return false;
    }

    if (rcIssued === 'yes') {
      if (!rcIssueDate) {
        Alert.alert('Validation Error', 'Please select RC issue date');
        return false;
      }
    } else {
      if (!rcNoText || rcNoText.trim() === '') {
        Alert.alert('Validation Error', 'Please enter RC not issued details');
        return false;
      }
    }

    if (noPlateIssued === 'yes') {
      if (!plateIssueDate) {
        Alert.alert('Validation Error', 'Please select number plate issue date');
        return false;
      }
    } else {
      if (!plateNoText || plateNoText.trim() === '') {
        Alert.alert('Validation Error', 'Please enter number plate not issued details');
        return false;
      }
    }

    if (tractorOwner === 'no') {
      if (!ownerDetails.ownerName || ownerDetails.ownerName.trim() === '') {
        Alert.alert('Validation Error', 'Please enter owner name');
        return false;
      }
      if (!ownerDetails.ownerFatherName || ownerDetails.ownerFatherName.trim() === '') {
        Alert.alert('Validation Error', 'Please enter owner father\'s name');
        return false;
      }
      if (!ownerDetails.ownerAddress || ownerDetails.ownerAddress.trim() === '') {
        Alert.alert('Validation Error', 'Please enter owner address');
        return false;
      }
      if (!ownerDetails.ownerMobile || ownerDetails.ownerMobile.trim() === '') {
        Alert.alert('Validation Error', 'Please enter owner mobile number');
        return false;
      }
      if (!ownerDetails.ownerRelation || ownerDetails.ownerRelation.trim() === '') {
        Alert.alert('Validation Error', 'Please select owner relation');
        return false;
      }
      if (ownerDetails.ownerRelation === 'Other' && (!relationOther || relationOther.trim() === '')) {
        Alert.alert('Validation Error', 'Please enter owner relation detail for Other');
        return false;
      }
    }

    if (!customerPhoto) {
      Alert.alert('Validation Error', 'Please add Customer Photo');
      return false;
    }
    if (!customerSignature) {
      Alert.alert('Validation Error', 'Please add Customer Signature');
      return false;
    }
    if (!managerSignature) {
      Alert.alert('Validation Error', 'Please add Manager Signature');
      return false;
    }

    if (!acceptedTerms) {
      Alert.alert('Validation Error', 'Please accept all terms and conditions');
      return false;
    }

    return true;
  };

  const prepareFormData = () => {
    const formDataToSend = new FormData();

    formDataToSend.append('id', existingFormId.toString());
    formDataToSend.append('form_no', existingFormNo);

    formDataToSend.append('user_id', userId);
    formDataToSend.append('form_date', new Date().toISOString().split('T')[0]);
    formDataToSend.append('employee_name', formData.employeeName);
    formDataToSend.append('customer_name', formData.customerName);
    formDataToSend.append('percentage', formData.percentage);
    formDataToSend.append('address', formData.address);
    formDataToSend.append('mobile_no', formData.mobileNo);
    formDataToSend.append('registration_no', formData.registrationNo);
    formDataToSend.append('tractor_model', formData.tractorModel);
    formDataToSend.append('select_date', formData.date ? formData.date.toISOString().split('T')[0] : '');
    
    formDataToSend.append('hypothecation', formData.hypothecation);
    formDataToSend.append('hypothecation_other', formData.hypothecation === 'Other' ? hypothecationOther : '');
    
    formDataToSend.append('chassis_no', formData.chassisNo);
    formDataToSend.append('pvc_card_no', formData.pvcCardNo || '');
    formDataToSend.append('engine_no', formData.engineNo);
    formDataToSend.append('rc_issued', rcIssued === 'yes' ? 'Yes' : 'No');
    formDataToSend.append('plate_issued', noPlateIssued === 'yes' ? 'Yes' : 'No');
    formDataToSend.append('tractor_owner', tractorOwner === 'yes' ? 'Yes' : 'No');

    formDataToSend.append('agriculture_certificate', agricultureCertificate);
    formDataToSend.append('agriculture_certificate_other', agricultureCertificate === 'other' ? agricultureOther : '');

    formDataToSend.append('customer_affidavit', customerAffidavit);
    formDataToSend.append('customer_affidavit_other', customerAffidavit === 'other' ? affidavitOther : '');

    formDataToSend.append('payment_status', paymentStatus);
    formDataToSend.append('payment_status_remark', paymentStatus === 'remarks' ? paymentRemarks : '');

    formDataToSend.append('rc_issued_at', rcIssued === 'yes' && rcIssueDate ? rcIssueDate.toISOString().split('T')[0] : '');
    formDataToSend.append('rc_issue_no', rcIssued === 'no' ? rcNoText : '');

    formDataToSend.append('plate_issued_at', noPlateIssued === 'yes' && plateIssueDate ? plateIssueDate.toISOString().split('T')[0] : '');
    formDataToSend.append('plate_issue_no', noPlateIssued === 'no' ? plateNoText : '');

    formDataToSend.append('relative_name', tractorOwner === 'no' ? ownerDetails.ownerName : '');
    formDataToSend.append('relative_father_name', tractorOwner === 'no' ? ownerDetails.ownerFatherName : '');
    formDataToSend.append('relative_address', tractorOwner === 'no' ? ownerDetails.ownerAddress : '');
    formDataToSend.append('relative_phone', tractorOwner === 'no' ? ownerDetails.ownerMobile : '');
    formDataToSend.append('relative_relation', tractorOwner === 'no' ? ownerDetails.ownerRelation : '');
    formDataToSend.append('relation_other', (tractorOwner === 'no' && ownerDetails.ownerRelation === 'Other') ? relationOther : '');

    if (customerPhoto && customerPhoto.startsWith('file://')) {
      formDataToSend.append('customer_photo', {
        uri: customerPhoto,
        type: 'image/jpeg',
        name: 'customer_photo.jpg',
      });
    }

    if (customerSignature && customerSignature.startsWith('file://')) {
      formDataToSend.append('customer_signature', {
        uri: customerSignature,
        type: 'image/jpeg',
        name: 'customer_signature.jpg',
      });
    }

    if (managerSignature && managerSignature.startsWith('file://')) {
      formDataToSend.append('manager_signature', {
        uri: managerSignature,
        type: 'image/jpeg',
        name: 'manager_signature.jpg',
      });
    }

    return formDataToSend;
  };

  // Save Updated Data
  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = prepareFormData();

      const config = {
        method: 'post',
        url: 'https://makroomotors.com/makroo-panel/public/api/v1/rc-no-plate-delivery/form/update',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        data: formDataToSend,
        timeout: 30000,
      };

      const response = await axios(config);

      if (response.data && response.data.status === true) {
        // Update local state with new status from API
        setStatus('pending');
        setIsEditMode(false);
        
        Alert.alert(
          'Success', 
          response.data.message || 'Form updated successfully! Form is now pending approval.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh data
                fetchFormData(existingFormId);
              }
            }
          ]
        );
      } else {
        const errorMessage = response.data?.message || 'Failed to update form';
        Alert.alert('Update Failed', errorMessage);
      }

    } catch (error) {
      console.log('Update Error:', error);
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.response) {
        if (error.response.status === 422) {
          const validationErrors = error.response.data.errors;
          if (validationErrors) {
            const firstErrorKey = Object.keys(validationErrors)[0];
            const firstError = validationErrors[firstErrorKey];
            errorMessage = firstError ? firstError[0] : 'Please check all required fields';
          } else {
            errorMessage = error.response.data.message || 'Validation error occurred';
          }
        } else {
          const serverError = error.response.data;
          errorMessage = serverError.message || serverError.error || `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      Alert.alert('Update Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Download PDF Handler
  const handleDownloadPDF = async () => {
    if (!existingFormId) {
      Alert.alert('Error', 'Form data not available');
      return;
    }

    setLoading(true);

    try {
      const config = {
        method: 'get',
        url: `https://makroomotors.com/makroo-panel/public/api/v1/rc-no-plate-delivery/form/generate-pdf/${existingFormId}`,
        timeout: 30000,
      };

      const response = await axios(config);
      
      if (response.data.status && response.data.pdf_link) {
        await Linking.openURL(response.data.pdf_link);
        Alert.alert('Success', 'PDF opened in browser');
      } else {
        Alert.alert('Error', 'Failed to generate PDF');
      }
    } catch (error) {
      console.log('PDF Error:', error);
      Alert.alert('Error', 'Failed to download PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateIconPress = () => {
    if (!isEditMode) return;
    setShowDatePicker(true);
  };

  const renderModelItem = ({item}) => (
    <TouchableOpacity
      style={styles.modelItem}
      onPress={() => handleModelSelect(item)}>
      <Text style={styles.modelItemText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderHypoItem = ({item}) => (
    <TouchableOpacity
      style={styles.modelItem}
      onPress={() => handleHypoSelect(item)}>
      <Text style={styles.modelItemText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderRelationItem = ({item}) => (
    <TouchableOpacity
      style={styles.modelItem}
      onPress={() => handleRelationSelect(item)}>
      <Text style={styles.modelItemText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderQRScanner = () => (
    <Modal
      visible={showChassisScanner || showEngineScanner}
      animationType="slide"
      transparent={false}
      onRequestClose={closeScanner}
    >
      <View style={styles.scannerContainer}>
        <View style={styles.scannerHeader}>
          <TouchableOpacity onPress={closeScanner} style={styles.scannerCloseButton}>
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.scannerTitle}>
            {showChassisScanner ? 'Scan Chassis Number' : 'Scan Engine Number'}
          </Text>
        </View>
        
        <Camera
          style={styles.camera}
          cameraOptions={{
            flashMode: 'auto',
            focusMode: 'on',
            zoomMode: 'on',
          }}
          scanBarcode={true}
          showFrame={true}
          laserColor="red"
          frameColor="white"
          onReadCode={handleQRCodeRead}
        />
        
        <View style={styles.scannerFooter}>
          <Text style={styles.scannerInstructions}>
            Point your camera at a QR code to scan
          </Text>
        </View>
      </View>
    </Modal>
  );

  const renderRadioOption = (value, currentValue, label, onPress) => (
    <TouchableOpacity
      style={[
        styles.radioOptionWrapper,
        currentValue === value && styles.radioOptionSelected,
      ]}
      onPress={onPress}
      disabled={!isEditMode || loading}
    >
      <LinearGradient
        colors={['#7E5EA9', '#20AEBC']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.radioOptionGradient}>
        <View
          style={[
            styles.radioOptionInner,
            currentValue === value && styles.radioOptionInnerSelected,
          ]}>
          <Text
            style={[
              styles.radioOptionText,
              currentValue === value && styles.radioOptionTextSelected,
            ]}>
            {label}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderInputField = (value, onChange, placeholder, keyboardType = 'default', editable = true) => {
    if (isEditMode) {
      return (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#666"
          editable={editable && !loading}
          keyboardType={keyboardType}
        />
      );
    } else {
      return (
        <Text style={[styles.input, styles.readOnlyInput]}>
          {value || 'Not provided'}
        </Text>
      );
    }
  };

  const renderDropdownField = (value, onPress, placeholder) => {
    if (isEditMode) {
      return (
        <TouchableOpacity 
          style={styles.input}
          onPress={onPress}
          disabled={loading}
        >
          <Text style={value ? styles.selectedModelText : styles.placeholderText}>
            {value || placeholder}
          </Text>
          <Icon name="keyboard-arrow-down" size={25} color="#666" style={styles.dropdownIcon} />
        </TouchableOpacity>
      );
    } else {
      return (
        <Text style={[styles.input, styles.readOnlyInput]}>
          {value || 'Not provided'}
        </Text>
      );
    }
  };

  const renderDateField = (date, onPress, placeholder) => {
    if (isEditMode) {
      return (
        <View style={styles.inputWithIcon}>
          <TouchableOpacity
            style={[styles.input, styles.inputWithIconField]}
            onPress={onPress}
            disabled={loading}
          >
            <Text style={date ? styles.selectedModelText : styles.placeholderText}>
              {date ? date.toLocaleDateString() : placeholder}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onPress}
            style={styles.iconButton}
            disabled={loading}
          >
            <Icon name="calendar-today" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <Text style={[styles.input, styles.readOnlyInput]}>
          {date ? date.toLocaleDateString() : 'Not provided'}
        </Text>
      );
    }
  };

  const renderImageBox = (imageUri, setImageFunction, label, boxStyle) => (
    <View style={styles.imageContainer}>
      <Text style={styles.imageLabel}>{label}</Text>
      {imageUri ? (
        <View style={styles.photoContainer}>
          <Image source={{ uri: imageUri }} style={boxStyle === styles.photoSignatureBox ? styles.avatar : styles.signatureImage} />
          {isEditMode && (
            <TouchableOpacity 
              style={styles.changePhotoButton} 
              onPress={() => showImageSourceOptions(setImageFunction, `Update ${label}`)}
            >
              <Text style={styles.changePhotoText}>Change {label.includes('Photo') ? 'Photo' : 'Signature'}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.photoContainer}>
          {boxStyle === styles.photoSignatureBox ? (
            <Image source={require('../Asset/Images/c10.png')} style={styles.avatar} />
          ) : null}
          {isEditMode && (
            <TouchableOpacity 
              style={styles.addPhotoButton} 
              onPress={() => showImageSourceOptions(setImageFunction, `Add ${label}`)}
            >
              <Text style={styles.addPhotoText}>Add {label.includes('Photo') ? 'Photo' : 'Signature'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (fetchLoading) {
    return (
      <View style={{flex: 1, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#7E5EA9" />
        <Text style={{marginTop: 10}}>Loading form data...</Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom}}>
      <LinearGradient
        colors={['#7E5EA9', '#20AEBC']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.companyName}>Makroo Motor Corporation</Text>
          <Text style={styles.companyName}>RC And Number Plate Delivery Form</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container}>
        <View style={styles.formHeader}>
          {/* <Text style={styles.formNo}>Form No: {existingFormNo}</Text> */}
          <Text style={styles.Date}>{new Date().toLocaleDateString()}</Text>
        </View>

        {isEditMode && (
          <View style={styles.editModeContainer}>
            <Text style={styles.editModeText}>Edit Mode - Updating Form ID: {existingFormId}</Text>
          </View>
        )}

        <View style={styles.photoSection}>
          {renderImageBox(customerPhoto, setCustomerPhoto, 'Customer Photo', styles.photoSignatureBox)}
        </View>

        <View style={styles.customerHeader}>
          <Text style={styles.customerName}>{formData.customerName || '—'}</Text>
          {/* <Text style={styles.customerId}>Form: {existingFormNo || '—'}</Text> */}
          <Text style={[styles.statusText, 
            status === 'approved' ? styles.statusApproved :
            status === 'pending' ? styles.statusPending :
            status === 'rejected' ? styles.statusRejected :
            status === 'edited' ? styles.statusEdited :
            styles.statusDefault
          ]}>
            Status: {status || '—'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.singleRow}>
            <Text style={styles.fieldLabel}>Employee Name</Text>
            <View style={styles.fullWidthContainer}>
              <LinearGradient
                colors={['#7E5EA9', '#20AEBC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.inputGradient}>
                {renderInputField(
                  formData.employeeName,
                  (text) => handleInputChange('employeeName', text),
                  'Enter employee name'
                )}
              </LinearGradient>
            </View>
          </View>

          <View style={styles.singleRow}>
            <Text style={styles.fieldLabel}>Customer Name</Text>
            <View style={styles.fullWidthContainer}>
              <LinearGradient
                colors={['#7E5EA9', '#20AEBC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.inputGradient}>
                {renderInputField(
                  formData.customerName,
                  (text) => handleInputChange('customerName', text),
                  'Enter customer name'
                )}
              </LinearGradient>
            </View>
          </View>

          <View style={styles.singleRow}>
            <Text style={styles.fieldLabel}>Parentage</Text>
            <View style={styles.fullWidthContainer}>
              <LinearGradient
                colors={['#7E5EA9', '#20AEBC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.inputGradient}>
                {renderInputField(
                  formData.percentage,
                  handlePercentageChange,
                  'Enter parentage'
                )}
              </LinearGradient>
            </View>
          </View>

          <View style={styles.singleRow}>
            <Text style={styles.fieldLabel}>Address</Text>
            <View style={styles.fullWidthContainer}>
              <LinearGradient
                colors={['#7E5EA9', '#20AEBC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.inputGradient}>
                {renderInputField(
                  formData.address,
                  (text) => handleInputChange('address', text),
                  'Enter address',
                  'default',
                  true
                )}
              </LinearGradient>
            </View>
          </View>

          <View style={styles.singleRow}>
            <Text style={styles.fieldLabel}>Mobile Number</Text>
            <View style={styles.fullWidthContainer}>
              <LinearGradient
                colors={['#7E5EA9', '#20AEBC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.inputGradient}>
                {renderInputField(
                  formData.mobileNo,
                  (text) => handleInputChange('mobileNo', text),
                  'Enter mobile number',
                  'phone-pad'
                )}
              </LinearGradient>
            </View>
          </View>

          <View style={styles.singleRow}>
            <Text style={styles.fieldLabel}>Registration Number</Text>
            <View style={styles.fullWidthContainer}>
              <LinearGradient
                colors={['#7E5EA9', '#20AEBC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.inputGradient}>
                {renderInputField(
                  formData.registrationNo,
                  (text) => handleInputChange('registrationNo', text),
                  'Enter registration number'
                )}
              </LinearGradient>
            </View>
          </View>

          <View style={styles.radioSection}>
            <View style={styles.radioGroup}>
              <Text style={styles.radioLabel}>Agriculture Certificate:</Text>
              <View style={styles.radioOptionsContainer}>
                {renderRadioOption('yes', agricultureCertificate, 'Yes', () => setAgricultureCertificate('yes'))}
                {renderRadioOption('no', agricultureCertificate, 'No', () => setAgricultureCertificate('no'))}
                {renderRadioOption('other', agricultureCertificate, 'Other', () => setAgricultureCertificate('other'))}
              </View>

              {agricultureCertificate === 'other' && (
                <View style={{marginTop: 8}}>
                  <Text style={styles.fieldLabel}>Agriculture Certificate Details</Text>
                  <LinearGradient
                    colors={['#7E5EA9', '#20AEBC']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={[styles.inputGradient, {marginTop: 4}]}>
                    {renderInputField(
                      agricultureOther,
                      (text) => setAgricultureOther(text),
                      'Enter agriculture certificate details'
                    )}
                  </LinearGradient>
                </View>
              )}
            </View>

            <View style={styles.radioGroup}>
              <Text style={styles.radioLabel}>Customer Affidavit:</Text>
              <View style={styles.radioOptionsContainer}>
                {renderRadioOption('yes', customerAffidavit, 'Yes', () => setCustomerAffidavit('yes'))}
                {renderRadioOption('no', customerAffidavit, 'No', () => setCustomerAffidavit('no'))}
                {renderRadioOption('other', customerAffidavit, 'Other', () => setCustomerAffidavit('other'))}
              </View>

              {customerAffidavit === 'other' && (
                <View style={{marginTop: 8}}>
                  <Text style={styles.fieldLabel}>Customer Affidavit Details</Text>
                  <LinearGradient
                    colors={['#7E5EA9', '#20AEBC']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={[styles.inputGradient, {marginTop: 4}]}>
                    {renderInputField(
                      affidavitOther,
                      (text) => setAffidavitOther(text),
                      'Enter customer affidavit details'
                    )}
                  </LinearGradient>
                </View>
              )}
            </View>

            <View style={styles.radioGroup}>
              <Text style={styles.radioLabel}>Payment Status:</Text>
              <View style={styles.radioOptionsContainer}>
                {renderRadioOption('paid', paymentStatus, 'Paid', () => setPaymentStatus('paid'))}
                {renderRadioOption('balance', paymentStatus, 'Balance', () => setPaymentStatus('balance'))}
                {renderRadioOption('remarks', paymentStatus, 'Remarks', () => setPaymentStatus('remarks'))}
              </View>

              {paymentStatus === 'remarks' && (
                <View style={{marginTop: 8}}>
                  <Text style={styles.fieldLabel}>Payment Status Remarks</Text>
                  <LinearGradient
                    colors={['#7E5EA9', '#20AEBC']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={[styles.inputGradient, {marginTop: 4}]}>
                    {renderInputField(
                      paymentRemarks,
                      (text) => setPaymentRemarks(text),
                      'Enter payment status remarks'
                    )}
                  </LinearGradient>
                </View>
              )}
            </View>
          </View>

          <View style={styles.singleRow}>
            <Text style={styles.fieldLabel}>Tractor Model</Text>
            <View style={styles.fullWidthContainer}>
              <LinearGradient
                colors={['#7E5EA9', '#20AEBC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.inputGradient}>
                {renderDropdownField(
                  formData.tractorModel,
                  () => setShowModelDropdown(true),
                  'Select tractor model'
                )}
              </LinearGradient>
            </View>
          </View>

          <View style={styles.singleRow}>
            <Text style={styles.fieldLabel}>Date</Text>
            <View style={styles.fullWidthContainer}>
              <LinearGradient
                colors={['#7E5EA9', '#20AEBC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.inputGradient}>
                {renderDateField(
                  formData.date,
                  handleDateIconPress,
                  'Select date'
                )}
                {showDatePicker && isEditMode && (
                  <DateTimePicker
                    value={formData.date || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                  />
                )}
              </LinearGradient>
            </View>
          </View>

          <View style={styles.singleRow}>
            <Text style={styles.fieldLabel}>Hypothecation</Text>
            <View style={styles.fullWidthContainer}>
              <LinearGradient
                colors={['#7E5EA9', '#20AEBC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.inputGradient}>
                {renderDropdownField(
                  formData.hypothecation === 'Other' ? 'Other' : formData.hypothecation,
                  () => setShowHypoDropdown(true),
                  'Select hypothecation'
                )}
              </LinearGradient>

              {formData.hypothecation === 'Other' && (
                <View style={{marginTop: 8}}>
                  <Text style={styles.fieldLabel}>Hypothecation Details</Text>
                  <LinearGradient
                    colors={['#7E5EA9', '#20AEBC']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.inputGradient}>
                    {renderInputField(
                      hypothecationOther,
                      (text) => setHypothecationOther(text),
                      'Enter hypothecation details'
                    )}
                  </LinearGradient>
                </View>
              )}
            </View>
          </View>

          <View style={styles.singleRow}>
            <Text style={styles.fieldLabel}>Chassis Number</Text>
            <View style={styles.fullWidthContainer}>
              <LinearGradient
                colors={['#7E5EA9', '#20AEBC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.inputGradient}>
                <View style={[styles.input, styles.inputWithIconField]}>
                  {renderInputField(
                    formData.chassisNo,
                    (text) => handleInputChange('chassisNo', text),
                    'Enter chassis number'
                  )}
                  {isEditMode && (
                    <TouchableOpacity
                      onPress={handleChassisScanPress}
                      style={styles.iconButton}
                      disabled={loading}
                    >
                      <Icon name="qr-code-scanner" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.singleRow}>
            <Text style={styles.fieldLabel}>PVC Card No.</Text>
            <View style={styles.fullWidthContainer}>
              <LinearGradient
                colors={['#7E5EA9', '#20AEBC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.inputGradient}>
                {renderInputField(
                  formData.pvcCardNo,
                  (text) => handleInputChange('pvcCardNo', text),
                  'PVC Card No.'
                )}
              </LinearGradient>
            </View>
          </View>

          <View style={styles.singleRow}>
            <Text style={styles.fieldLabel}>Engine Number</Text>
            <View style={styles.fullWidthContainer}>
              <LinearGradient
                colors={['#7E5EA9', '#20AEBC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.inputGradient}>
                <View style={[styles.input, styles.inputWithIconField]}>
                  {renderInputField(
                    formData.engineNo,
                    (text) => handleInputChange('engineNo', text),
                    'Enter engine number'
                  )}
                  {isEditMode && (
                    <TouchableOpacity
                      onPress={handleEngineScanPress}
                      style={styles.iconButton}
                      disabled={loading}
                    >
                      <Icon name="qr-code-scanner" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            </View>
          </View>
        </View>

        <Modal
          visible={showModelDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowModelDropdown(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Tractor Model</Text>
                <TouchableOpacity 
                  onPress={() => setShowModelDropdown(false)}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={tractorModels}
                renderItem={renderModelItem}
                keyExtractor={(item, index) => index.toString()}
                style={styles.modelList}
                showsVerticalScrollIndicator={true}
              />
            </View>
          </View>
        </Modal>

        <Modal
          visible={showHypoDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowHypoDropdown(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Hypothecation</Text>
                <TouchableOpacity 
                  onPress={() => setShowHypoDropdown(false)}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={hypothecationOptions}
                renderItem={renderHypoItem}
                keyExtractor={(item, index) => index.toString()}
                style={styles.modelList}
                showsVerticalScrollIndicator={true}
              />
            </View>
          </View>
        </Modal>

        <Modal
          visible={showRelationDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowRelationDropdown(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Relation</Text>
                <TouchableOpacity 
                  onPress={() => setShowRelationDropdown(false)}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={relationOptions}
                renderItem={renderRelationItem}
                keyExtractor={(item, index) => index.toString()}
                style={styles.modelList}
                showsVerticalScrollIndicator={true}
              />
            </View>
          </View>
        </Modal>

        {renderQRScanner()}

        <View style={styles.radioSection}>
          <View style={styles.radioGroup}>
            <Text style={styles.radioLabel}>RC Issued:</Text>
            <View style={styles.radioOptionsContainer}>
              <TouchableOpacity
                style={[
                  styles.radioOptionWrapper,
                  rcIssued === 'yes' && styles.radioOptionSelected,
                ]}
                onPress={() => isEditMode && setRcIssued('yes')}
                disabled={!isEditMode || loading}
              >
                <LinearGradient
                  colors={['#7E5EA9', '#20AEBC']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.radioOptionGradient}>
                  <View
                    style={[
                      styles.radioOptionInner,
                      rcIssued === 'yes' && styles.radioOptionInnerSelected,
                    ]}>
                    <Text
                      style={[
                        styles.radioOptionText,
                        rcIssued === 'yes' && styles.radioOptionTextSelected,
                      ]}>
                      Yes
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.radioOptionWrapper,
                  rcIssued === 'no' && styles.radioOptionSelected,
                ]}
                onPress={() => isEditMode && setRcIssued('no')}
                disabled={!isEditMode || loading}
              >
                <LinearGradient
                  colors={['#7E5EA9', '#20AEBC']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.radioOptionGradient}>
                  <View
                    style={[
                      styles.radioOptionInner,
                      rcIssued === 'no' && styles.radioOptionInnerSelected,
                    ]}>
                    <Text
                      style={[
                        styles.radioOptionText,
                        rcIssued === 'no' && styles.radioOptionTextSelected,
                      ]}>
                      No
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{marginTop: 8}}>
              {rcIssued === 'yes' ? (
                <>
                  <Text style={styles.fieldLabel}>RC Issue Date</Text>
                  <LinearGradient
                    colors={['#7E5EA9', '#20AEBC']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.inputGradient}>
                    {renderDateField(
                      rcIssueDate,
                      () => setShowRcDatePicker(true),
                      'Select RC issue date'
                    )}
                    {showRcDatePicker && isEditMode && (
                      <DateTimePicker
                        value={rcIssueDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleRcDateChange}
                      />
                    )}
                  </LinearGradient>
                </>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>RC Not Issued Reason</Text>
                  <LinearGradient
                    colors={['#7E5EA9', '#20AEBC']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={[styles.inputGradient, {marginTop: 4}]}>
                    {renderInputField(
                      rcNoText,
                      (text) => setRcNoText(text),
                      'Enter why RC was not issued'
                    )}
                  </LinearGradient>
                </>
              )}
            </View>
          </View>

          <View style={styles.radioGroup}>
            <Text style={styles.radioLabel}>No. Plate Issued:</Text>
            <View style={styles.radioOptionsContainer}>
              <TouchableOpacity
                style={[
                  styles.radioOptionWrapper,
                  noPlateIssued === 'yes' && styles.radioOptionSelected,
                ]}
                onPress={() => isEditMode && setNoPlateIssued('yes')}
                disabled={!isEditMode || loading}
              >
                <LinearGradient
                  colors={['#7E5EA9', '#20AEBC']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.radioOptionGradient}>
                  <View
                    style={[
                      styles.radioOptionInner,
                      noPlateIssued === 'yes' && styles.radioOptionInnerSelected,
                    ]}>
                    <Text
                      style={[
                        styles.radioOptionText,
                        noPlateIssued === 'yes' && styles.radioOptionTextSelected,
                      ]}>
                      Yes
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.radioOptionWrapper,
                  noPlateIssued === 'no' && styles.radioOptionSelected,
                ]}
                onPress={() => isEditMode && setNoPlateIssued('no')}
                disabled={!isEditMode || loading}
              >
                <LinearGradient
                  colors={['#7E5EA9', '#20AEBC']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.radioOptionGradient}>
                  <View
                    style={[
                      styles.radioOptionInner,
                      noPlateIssued === 'no' && styles.radioOptionInnerSelected,
                    ]}>
                    <Text
                      style={[
                        styles.radioOptionText,
                        noPlateIssued === 'no' && styles.radioOptionTextSelected,
                      ]}>
                      No
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{marginTop: 8}}>
              {noPlateIssued === 'yes' ? (
                <>
                  <Text style={styles.fieldLabel}>Plate Issue Date</Text>
                  <LinearGradient
                    colors={['#7E5EA9', '#20AEBC']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.inputGradient}>
                    {renderDateField(
                      plateIssueDate,
                      () => setShowPlateDatePicker(true),
                      'Select plate issue date'
                    )}
                    {showPlateDatePicker && isEditMode && (
                      <DateTimePicker
                        value={plateIssueDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handlePlateDateChange}
                      />
                    )}
                  </LinearGradient>
                </>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Plate Not Issued Reason</Text>
                  <LinearGradient
                    colors={['#7E5EA9', '#20AEBC']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={[styles.inputGradient, {marginTop: 4}]}>
                    {renderInputField(
                      plateNoText,
                      (text) => setPlateNoText(text),
                      'Enter why plate was not issued'
                    )}
                  </LinearGradient>
                </>
              )}
            </View>
          </View>

          <View style={styles.radioGroup}>
            <Text style={styles.radioLabel}>Are Tractor Owner:</Text>
            <View style={styles.radioOptionsContainer}>
              <TouchableOpacity
                style={[
                  styles.radioOptionWrapper,
                  tractorOwner === 'yes' && styles.radioOptionSelected,
                ]}
                onPress={() => isEditMode && setTractorOwner('yes')}
                disabled={!isEditMode || loading}
              >
                <LinearGradient
                  colors={['#7E5EA9', '#20AEBC']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.radioOptionGradient}>
                  <View
                    style={[
                      styles.radioOptionInner,
                      tractorOwner === 'yes' && styles.radioOptionInnerSelected,
                    ]}>
                    <Text
                      style={[
                        styles.radioOptionText,
                        tractorOwner === 'yes' && styles.radioOptionTextSelected,
                      ]}>
                      Yes
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.radioOptionWrapper,
                  tractorOwner === 'no' && styles.radioOptionSelected,
                ]}
                onPress={() => isEditMode && setTractorOwner('no')}
                disabled={!isEditMode || loading}
              >
                <LinearGradient
                  colors={['#7E5EA9', '#20AEBC']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.radioOptionGradient}>
                  <View
                    style={[
                      styles.radioOptionInner,
                      tractorOwner === 'no' && styles.radioOptionInnerSelected,
                    ]}>
                    <Text
                      style={[
                        styles.radioOptionText,
                        tractorOwner === 'no' && styles.radioOptionTextSelected,
                      ]}>
                      No
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {tractorOwner === 'no' && (
              <View style={{marginTop: 8}}>
                <View style={styles.singleRow}>
                  <Text style={styles.fieldLabel}>Owner Name</Text>
                  <View style={styles.fullWidthContainer}>
                    <LinearGradient
                      colors={['#7E5EA9', '#20AEBC']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={styles.inputGradient}>
                      {renderInputField(
                        ownerDetails.ownerName,
                        (text) => setOwnerDetails(prev => ({...prev, ownerName: text})),
                        'Enter owner name'
                      )}
                    </LinearGradient>
                  </View>
                </View>

                <View style={styles.singleRow}>
                  <Text style={styles.fieldLabel}>Father's Name</Text>
                  <View style={styles.fullWidthContainer}>
                    <LinearGradient
                      colors={['#7E5EA9', '#20AEBC']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={styles.inputGradient}>
                      {renderInputField(
                        ownerDetails.ownerFatherName,
                        (text) => setOwnerDetails(prev => ({...prev, ownerFatherName: text})),
                        'Enter father\'s name'
                      )}
                    </LinearGradient>
                  </View>
                </View>

                <View style={styles.singleRow}>
                  <Text style={styles.fieldLabel}>Owner Address</Text>
                  <View style={styles.fullWidthContainer}>
                    <LinearGradient
                      colors={['#7E5EA9', '#20AEBC']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={styles.inputGradient}>
                      {renderInputField(
                        ownerDetails.ownerAddress,
                        (text) => setOwnerDetails(prev => ({...prev, ownerAddress: text})),
                        'Enter owner address'
                      )}
                    </LinearGradient>
                  </View>
                </View>

                <View style={styles.singleRow}>
                  <Text style={styles.fieldLabel}>Owner Mobile Number</Text>
                  <View style={styles.fullWidthContainer}>
                    <LinearGradient
                      colors={['#7E5EA9', '#20AEBC']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={styles.inputGradient}>
                      {renderInputField(
                        ownerDetails.ownerMobile,
                        (text) => setOwnerDetails(prev => ({...prev, ownerMobile: text})),
                        'Enter owner mobile number',
                        'phone-pad'
                      )}
                    </LinearGradient>
                  </View>
                </View>

                <View style={styles.singleRow}>
                  <Text style={styles.fieldLabel}>Relation with Owner</Text>
                  <View style={styles.fullWidthContainer}>
                    <LinearGradient
                      colors={['#7E5EA9', '#20AEBC']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={styles.inputGradient}>
                      {renderDropdownField(
                        ownerDetails.ownerRelation === 'Other' ? 'Other' : ownerDetails.ownerRelation,
                        () => setShowRelationDropdown(true),
                        'Select relation with owner'
                      )}
                    </LinearGradient>

                    {ownerDetails.ownerRelation === 'Other' && (
                      <View style={{marginTop: 8}}>
                        <Text style={styles.fieldLabel}>Relation Details</Text>
                        <LinearGradient
                          colors={['#7E5EA9', '#20AEBC']}
                          start={{x: 0, y: 0}}
                          end={{x: 1, y: 0}}
                          style={styles.inputGradient}>
                          {renderInputField(
                            relationOther,
                            (text) => setRelationOther(text),
                            'Enter relation details'
                          )}
                        </LinearGradient>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Signatures</Text>
          
          {customerSignature ? (
            <View style={{ marginVertical: 10 }}>
              <Text style={{ marginBottom: 6, fontWeight: 'bold' }}>Customer Signature</Text>
              <Image source={{ uri: customerSignature }} style={{ height: 80, width: 220, resizeMode: 'contain', borderWidth: 1, borderColor: '#ccc' }} />
              {isEditMode && (
                <TouchableOpacity 
                  style={styles.changeSignatureButton} 
                  onPress={() => showImageSourceOptions(setCustomerSignature, 'Update Customer Signature')}
                >
                  <Text style={styles.changeSignatureText}>Change Customer Signature</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            isEditMode && (
              <View style={{ marginVertical: 10 }}>
                <Text style={{ marginBottom: 6, fontWeight: 'bold' }}>Customer Signature</Text>
                <TouchableOpacity 
                  style={styles.addSignatureButton} 
                  onPress={() => showImageSourceOptions(setCustomerSignature, 'Add Customer Signature')}
                >
                  <Text style={styles.addSignatureText}>Add Customer Signature</Text>
                </TouchableOpacity>
              </View>
            )
          )}
          
          {managerSignature ? (
            <View style={{ marginVertical: 10 }}>
              <Text style={{ marginBottom: 6, fontWeight: 'bold' }}>Manager Signature</Text>
              <Image source={{ uri: managerSignature }} style={{ height: 80, width: 220, resizeMode: 'contain', borderWidth: 1, borderColor: '#ccc' }} />
              {isEditMode && (
                <TouchableOpacity 
                  style={styles.changeSignatureButton} 
                  onPress={() => showImageSourceOptions(setManagerSignature, 'Update Manager Signature')}
                >
                  <Text style={styles.changeSignatureText}>Change Manager Signature</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            isEditMode && (
              <View style={{ marginVertical: 10 }}>
                <Text style={{ marginBottom: 6, fontWeight: 'bold' }}>Manager Signature</Text>
                <TouchableOpacity 
                  style={styles.addSignatureButton} 
                  onPress={() => showImageSourceOptions(setManagerSignature, 'Add Manager Signature')}
                >
                  <Text style={styles.addSignatureText}>Add Manager Signature</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>

        <View style={styles.termsContainer}>
          <Text style={styles.termsTitle}>Terms and Conditions:</Text>
          <View style={styles.termsList}>
            <Text style={styles.termItem}>1. The Rc And Number Plate Will Be Delivered Only After Full Payment Clearance.</Text>
            <Text style={styles.termItem}>2. Customer Must Provide Valid Id Proof Before Receiving The Rc Or Number Plate.</Text>
            <Text style={styles.termItem}>3. Delivery To Branch Staff Requires Prior Written Authorization From The Head Office.</Text>
            <Text style={styles.termItem}>4. Branch Personnel Must Verify All Customer Details Before Handover.</Text>
            <Text style={styles.termItem}>5. Once Delivered, Makroo Motor Corporation Will Not Be Responsible For Loss Or Damage.</Text>
            <Text style={styles.termItem}>6. Any Correction Or Reissue Request Must Be Submitted In Writing With Valid Reason.</Text>
            <Text style={styles.termItem}>7. Rc And Number Plate Will Not Be Handed Over To Any Unauthorized Person.</Text>
            <Text style={styles.termItem}>8. Customer Or Branch Representative Must Sign And Acknowledge Receipt At The Time Of Delivery.</Text>
            <Text style={styles.termItem}>9. All Records Of Delivery Must Be Updated In The Company Database The Same Day.</Text>
            <Text style={styles.termItem}>10. Duplicate Delivery Is Not Allowed Without Written Approval From The Head Office.</Text>
            <Text style={styles.termItem}>11. If The Customer Fails To Collect The Rc Or Number Plate Within 30 Days, Storage Or Courier Charges May Apply.</Text>
            <Text style={styles.termItem}>12. In Case Of Dispute, The Decision Of Makroo Motor Corporation Management Will Be Final.</Text>
          </View>

          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => isEditMode && setAcceptedTerms(!acceptedTerms)}
            disabled={!isEditMode || loading}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms && <Icon name="check" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Accept All Terms And Conditions</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          {/* Edit Button - Only show when backend status is 'edited' */}
          {route.params?.backendStatus === 'edited' && !isEditMode && (
            <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
              <Text style={styles.editButtonText}>Edit Form</Text>
            </TouchableOpacity>
          )}

          {isEditMode && (
            <>
              <TouchableOpacity 
                style={[styles.submitButton, (loading || !acceptedTerms) && styles.disabledButton]} 
                onPress={handleUpdate}
                disabled={loading || !acceptedTerms}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Form</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.cancelButton, loading && styles.disabledButton]} 
                onPress={handleCancelEdit}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Download PDF Button - Only show when status is 'approved' */}
          {status === 'approved' && (
            <TouchableOpacity 
              style={[styles.pdfButton, loading && styles.disabledButton]} 
              onPress={handleDownloadPDF}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.pdfButtonText}>Download PDF</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.homeButton, loading && styles.disabledButton]} 
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.homeButtonText}>Back to List</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 5,
  },
  formNo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  Date: {
    fontSize: 12,
    color: '#00000099',
  },
  editModeContainer: {
    backgroundColor: '#f0e6ff',
    padding: 8,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: 'center',
  },
  editModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7E5EA9',
  },
  photoSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  photoContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  signatureImage: {
    height: 80,
    width: 220,
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#ccc'
  },
  changePhotoButton: { 
    backgroundColor: '#7E5EA9', 
    padding: 8, 
    borderRadius: 6, 
    marginTop: 8,
  },
  changePhotoText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 12 
  },
  addPhotoButton: { 
    backgroundColor: '#20AEBC', 
    padding: 10, 
    borderRadius: 6, 
    marginTop: 8,
  },
  addPhotoText: { 
    color: 'white', 
    fontWeight: 'bold' 
  },
  customerHeader: {
    alignItems: 'center',
    marginVertical: 10,
    marginBottom: 10,
  },
  customerName: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
  },
  customerId: {
    fontSize: 13,
    color: '#56616D',
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusApproved: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  statusPending: {
    backgroundColor: '#2196F3',
    color: 'white',
  },
  statusRejected: {
    backgroundColor: '#F44336',
    color: 'white',
  },
  statusEdited: {
    backgroundColor: '#FF9800',
    color: 'white',
  },
  statusDefault: {
    backgroundColor: '#9E9E9E',
    color: 'white',
  },
  formContainer: {
    marginBottom: 15,
  },
  singleRow: {
    marginBottom: 10,
  },
  fullWidthContainer: {
    width: '100%',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#000',
  },
  inputGradient: {
    borderRadius: 10,
    padding: 1,
  },
  input: {
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
  },
  readOnlyInput: {
    color: '#666',
    backgroundColor: '#f5f5f5',
  },
  selectedModelText: {
    fontSize: 14,
    color: '#000',
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWithIconField: {
    flex: 1,
  },
  iconButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modelList: {
    maxHeight: 300,
  },
  modelItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modelItemText: {
    fontSize: 14,
    color: '#333',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  scannerCloseButton: {
    padding: 8,
    marginRight: 15,
  },
  scannerTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  scannerFooter: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
  },
  scannerInstructions: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  radioSection: {
    marginBottom: 15,
  },
  radioGroup: {
    marginBottom: 15,
  },
  radioLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000',
  },
  radioOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  radioOptionWrapper: {
    flex: 1,
    maxWidth: '90%',
    marginHorizontal: 8,
  },
  radioOptionGradient: {
    borderRadius: 6,
    padding: 1,
  },
  radioOptionInner: {
    borderRadius: 5,
    paddingVertical: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  radioOptionInnerSelected: {
    backgroundColor: '#7E5EA9',
  },
  radioOptionSelected: {},
  radioOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },
  radioOptionTextSelected: {
    color: '#fff',
  },
  termsContainer: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
    marginBottom: 50
  },
  termsTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  termsList: {
    marginBottom: 15,
  },
  termItem: {
    fontSize: 12.5,
    color: '#333',
    marginBottom: 5,
    lineHeight: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  imageContainer: {
    marginBottom: 20,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#000',
  },
  photoSignatureBox: {
    // Used for customer photo
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  changeSignatureButton: { 
    backgroundColor: '#7E5EA9', 
    padding: 10, 
    borderRadius: 6, 
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  changeSignatureText: { 
    color: 'white', 
    fontWeight: 'bold' 
  },
  addSignatureButton: { 
    backgroundColor: '#20AEBC', 
    padding: 15, 
    borderRadius: 6, 
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed'
  },
  addSignatureText: { 
    color: 'white', 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  editButton: {
    backgroundColor: '#FFA000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#7E5EA9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pdfButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    backgroundColor: '#20AEBC',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default Rcinternalpage;