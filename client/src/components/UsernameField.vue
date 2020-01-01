<template>
    <div v-bind:class="amplifyUI.formField">
        <div v-if="shouldRenderUsernameField">
            <div v-bind:class="amplifyUI.inputLabel">{{$Amplify.I18n.get(getUsernameLabel())}} *</div>
            <input 
                v-bind:class="amplifyUI.input" 
                v-model="username" 
                :placeholder="$Amplify.I18n.get(`Enter your ${getUsernameLabel()}`)" 
                autofocus 
                v-on:blur="usernameChanged" 
                v-bind:data-test="auth.genericAttrs.usernameInput"
            />
        </div>
        <div v-if="shouldRenderEmailField">
            <div v-bind:class="amplifyUI.inputLabel">{{$Amplify.I18n.get('Email')}} *</div>
            <input 
                v-bind:class="amplifyUI.input" 
                v-model="email" 
                :placeholder="$Amplify.I18n.get('Enter your email')" 
                autofocus 
                v-on:keyup="emailChanged" 
                v-bind:data-test="auth.genericAttrs.emailInput"
            />
        </div>
        <div v-if="shouldRenderPhoneNumberField">
            <amplify-phone-field 
                v-bind:required="phoneNumberRequired"
                v-on:phone-number-changed="phoneNumberChanged"
            ></amplify-phone-field>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
import * as AmplifyUI from '@aws-amplify/ui';
import countries from 'aws-amplify-vue/src/assets/countries';
// import { labelMap } from './common';
// import PhoneField from './PhoneField';
// import { composePhoneNumber } from './common';
import { auth } from 'aws-amplify-vue/src/assets/data-test-attributes';

// Vue.component('amplify-phone-field', PhoneField);

export default {
    name: 'UsernameField',
    props: ['usernameAttributes'],
    data() {
        return {
            username: '',
            email: '',
            amplifyUI: AmplifyUI,
            phoneNumberRequired: true,
            auth,
        }
    },
    computed: {
        shouldRenderEmailField() {
            return this.usernameAttributes === 'email';
        },
        shouldRenderUsernameField() {
            return this.usernameAttributes !== 'email' && this.usernameAttributes !== 'phone_number';
        },
        shouldRenderPhoneNumberField() {
            return this.usernameAttributes === 'phone_number';
        },
    },
    methods: {
        getUsernameLabel() {
            return this.usernameAttributes;
        },
        phoneNumberChanged(data) {
            const phoneNumber = composePhoneNumber(data.countryCode, data.local_phone_number);
            this.$emit('username-field-changed', {usernameField: 'phone_number', phoneNumber});
        },
        emailChanged() {
            this.$emit('username-field-changed', {usernameField: 'email', email: this.email});
        },
        usernameChanged() {
            console.log(this.username);
            this.$emit('username-field-changed', {usernameField: 'username', username: this.username});
        }
        
    }
}
</script>
