import removeAccents from './removeAccents.js';
// @desc check user password
// @desc password valid: 6-10 chars
var checkUserPassword = (password) => {
  var regex = /^[A-Za-z\d]{6,10}$/;
  return regex.test(password);
}

// @desc check phone number
// @desc password valid: 10 digits, begin with '0'
var checkPhoneNumber = (phoneNumber) => {
  var regex = /^0[0-9]{9}$/;
  return regex.test(phoneNumber);
}

const checkNotNegativeInteger = x => {
  let parsed = parseInt(x, 10);
  if (!isNaN(parsed)) {
    if (Number.isInteger(parsed) && parsed >= 0) return true;
    return false;
  }
  return false;
}

const checkIsInteger = x => {
  let parsed = parseInt(x, 10);
  if (isNaN(parsed)) return false;
  if (Number.isInteger(parsed)) return true;
  else return false;
}

// @desc check phone number
// @desc password valid: 10 digits, begin with '0'
var checkVerifyCode = (verifyCode) => {
  var regex = /^[1-9][0-9]{3}$/;
  return regex.test(verifyCode);
}

// check user_name
const checkUserName = (userName) => {
  if (userName.length == 0 || userName.length < 4 || userName > 18) return false;
  var regex = /^[a-zA-Z0-9]*$/;
  if (!regex.test(userName)) return false;
  return true;
}

// check email
const checkEmail = (email) => {
  if (email.length == 0) return false;
  var regex = /^\S+@\S+\.\S+$/;
  if (!regex.test(email)) return false;
  return true;
}

// check file img
const checkImageFile = (file) => {
  if (!file) return false;

  // Get the file extension
  const extension = file.originalname.split('.').pop().toLowerCase();
  // Check if the file extension is an image format
  const imageFormats = ['jpeg', 'jpg', 'png', 'gif', 'bmp'];
  if (!imageFormats.includes(extension)) return false;

  return true;
}

// check link
var checkLink = link => {
  let banLink = ['bilutv.com', 'hayhaytv.com', 'hdviet.com', 'phimmoi.net', 'hdonline.vn', 'phimbathu.com', 'vnhackers.com'];
  let result = banLink.filter(e => link.includes(e));
  if (result.length > 0) return false;
  else return true;
}

// @desc check index, count
// @desc index va count la so va khong chua ki tu dac biet
var checkNumber = (number) => {
  var regex = /^[0-9]*$/;
  return regex.test(number);
}

// checkUserName('thanh _sh9 ')
//   .then(res => console.log(res))
//   .catch(err => console.error(err));
// console.log(checkLink('http://vnhackers.com.com/gg'))
export default { checkUserPassword, checkPhoneNumber, checkNotNegativeInteger, checkIsInteger, checkVerifyCode, checkEmail, checkImageFile, checkUserName, checkLink, checkNumber };