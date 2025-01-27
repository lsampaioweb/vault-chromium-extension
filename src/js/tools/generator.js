import { I18n, notification, form } from '../common.js';
import { Page } from './generator-page.js';
import { Password } from '../libs/password.js';

let showPassword = false;

async function mainLoaded() {
  try {
    const size = Page.getInputSize();
    const btnGenerate = Page.getButtonGenerate();
    const generatedPasswordElement = Page.getGeneratedPassword();
    const generatedPasswordToggleView = Page.getGeneratedPasswordToggleView();
    const generatedPasswordCopyImg = Page.getGeneratedPasswordCopyImg();

    form.addClickListener(btnGenerate, generatePasswordHandler);
    form.addClickListener(generatedPasswordToggleView, toggleShowPassword);
    form.addClickListener(generatedPasswordElement, copyPasswordToClipboard);
    form.addClickListener(generatedPasswordCopyImg, copyPasswordToClipboard);

    form.addEnterKeydownListener(size, btnGenerate);

    Page.setFocusOnFirstElementOrFirstEmpty();
  } catch (error) {
    notification.error(error);
  }
}

function generatePasswordHandler() {
  try {
    notification.clear();

    const generatedPasswordElement = Page.getGeneratedPassword();
    const hiddenGeneratedPasswordElement = Page.getHiddenGeneratedPassword();

    form.hide(Page.getLabelGeneratedPassword());
    form.setValue(generatedPasswordElement, '');
    form.setValue(hiddenGeneratedPasswordElement, '');

    const numbers = Page.getInputNumbersYes();
    const lowercase = Page.getInputLowercaseYes();
    const uppercase = Page.getInputUppercaseYes();
    const specialCharacters = Page.getInputSpecialCharactersYes();
    const size = Page.getInputSize();

    if (!form.isAnyElementChecked(numbers, lowercase, uppercase, specialCharacters)) {
      notification.error(I18n.getMessage('password_generator_at_least_one_option_must_be_selected'));
    } else {
      const result = form.validate({ required: [size] }, Page.isValid);
      if (result) {
        const generatedPassword = Password.generate({
          useNumbers: numbers.checked,
          useLowercase: lowercase.checked,
          useUppercase: uppercase.checked,
          useSpecialCharacters: specialCharacters.checked,
          size: size.value,
        });

        form.setValue(hiddenGeneratedPasswordElement, generatedPassword);

        setGeneratedPasswordToElementInForm(generatedPasswordElement, generatedPassword);

        form.show(Page.getLabelGeneratedPassword());
      }
    }

    Page.setFocusOnFirstElementOrFirstEmpty();
  } catch (error) {
    notification.error(error);
  }
}

function toggleShowPassword() {
  try {
    showPassword = !showPassword;

    const generatedPasswordElement = Page.getGeneratedPassword();
    const hiddenGeneratedPasswordElement = Page.getHiddenGeneratedPassword();

    const generatedPassword = form.getValue(hiddenGeneratedPasswordElement);

    setGeneratedPasswordToElementInForm(generatedPasswordElement, generatedPassword);
  } catch (error) {
    notification.error(error);
  }
}

function setGeneratedPasswordToElementInForm(generatedPasswordElement, generatedPassword) {
  if (showPassword) {
    form.setValue(generatedPasswordElement, generatedPassword);

    changeToHidePasswordImage();
  } else {
    form.setValue(generatedPasswordElement, form.replaceAllCharactersWithAsterisks(generatedPassword));

    changeToShowPasswordImage();
  }
}

function changeToHidePasswordImage() {
  changeToImage("hide-password.svg");
}

function changeToShowPasswordImage() {
  changeToImage("show-password.svg");
}

function changeToImage(imageName) {
  const generatedPasswordToggleView = Page.getGeneratedPasswordToggleView();

  generatedPasswordToggleView.src = `/images/icons/${imageName}`;
}

async function copyPasswordToClipboard(event) {
  try {
    await Page.copyElementToClipboard(Page.getHiddenGeneratedPassword());

    // Cancel the default action.
    event.preventDefault();
  } catch (error) {
    notification.clear().error(error);
  }
}

// Call the function after that page has finished loading.
document.addEventListener('DOMContentLoaded', mainLoaded, false);
