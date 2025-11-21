import { DateOfBirthPicker } from '@/components/shared/DateOfBirthPicker';
import { DatePicker } from '@/components/shared/DatePicker';
import { ModernFileUpload } from '@/components/shared/ModernFileUpload';
import { ProfilePhotoCropper } from '@/components/shared/ProfilePhotoCropper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useDebounce } from '@/hooks/useDebounce';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import type { MembershipStatus, MembershipType } from '@/types/members';
import {
  Camera,
  FileText,
  Phone,
  User,
  X,
  Upload,
  Loader2,
  Shield,
} from 'lucide-react';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';

// Form data interface - aligned with database schema
export interface DefaultMembershipFormData {
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth?: Date;
  gender: string;
  marital_status: string;
  phone: string;
  email?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  membership_id: string;
  membership_status: MembershipStatus;
  membership_type: MembershipType;
  date_joined?: Date;
  baptism_date?: Date;
  notes?: string;
  profile_image_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

// Form validation errors interface
export interface FormValidationErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  membership_status?: string;
  membership_type?: string;
  date_joined?: string;
  baptism_date?: string;
  profile_photo?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

// Form methods interface for external access
export interface DefaultMembershipFormMethods {
  getFormData: () => DefaultMembershipFormData;
  validateForm: () => { isValid: boolean; errors: FormValidationErrors };
  resetForm: () => void;
}

interface DefaultMembershipFormProps {
  isPreviewMode?: boolean;
  className?: string;
  onFormDataChange?: (data: DefaultMembershipFormData) => void;
  initialData?: Partial<DefaultMembershipFormData>;
}

export const DefaultMembershipForm = forwardRef<
  DefaultMembershipFormMethods,
  DefaultMembershipFormProps
>(
  (
    { isPreviewMode = false, className = '', onFormDataChange, initialData },
    ref
  ) => {
    // Form state
    const [firstName, setFirstName] = useState(initialData?.first_name || '');
    const [middleName, setMiddleName] = useState(
      initialData?.middle_name || ''
    );
    const [lastName, setLastName] = useState(initialData?.last_name || '');
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
      initialData?.date_of_birth
    );
    const [gender, setGender] = useState(initialData?.gender || '');
    const [maritalStatus, setMaritalStatus] = useState(
      initialData?.marital_status || ''
    );
    const [phone, setPhone] = useState(initialData?.phone || '');
    const [email, setEmail] = useState(initialData?.email || '');
    const [addressLine1, setAddressLine1] = useState(
      initialData?.address_line_1 || ''
    );
    const [addressLine2, setAddressLine2] = useState(
      initialData?.address_line_2 || ''
    );
    const [city, setCity] = useState(initialData?.city || '');
    const [state, setState] = useState(initialData?.state || '');
    const [postalCode, setPostalCode] = useState(
      initialData?.postal_code || ''
    );
    const [country, setCountry] = useState(initialData?.country || '');
    const [membershipId] = useState(() => {
      // Use existing membership ID if available, otherwise generate new one
      if (initialData?.membership_id) {
        return initialData.membership_id;
      }
      // Generate random 6-8 digit number
      const minDigits = 6;
      const maxDigits = 8;
      const digits =
        Math.floor(Math.random() * (maxDigits - minDigits + 1)) + minDigits;
      const min = Math.pow(10, digits - 1);
      const max = Math.pow(10, digits) - 1;
      const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
      return randomNumber.toString();
    }); // Auto-generated random 6-8 digit number or use existing
    const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>(
      initialData?.membership_status || 'active'
    );
    const [membershipType, setMembershipType] = useState<MembershipType>(
      initialData?.membership_type || 'Regular'
    );
    const [dateJoined, setDateJoined] = useState<Date | undefined>(
      initialData?.date_joined
    );
    const [baptismDate, setBaptismDate] = useState<Date | undefined>(
      initialData?.baptism_date
    );
    const [notes, setNotes] = useState(initialData?.notes || '');

    // Emergency contact state
    const [emergencyContactName, setEmergencyContactName] = useState(
      initialData?.emergency_contact_name || ''
    );
    const [emergencyContactPhone, setEmergencyContactPhone] = useState(
      initialData?.emergency_contact_phone || ''
    );
    const [
      emergencyContactRelationship,
      setEmergencyContactRelationship,
    ] = useState(initialData?.emergency_contact_relationship || '');

    // Profile photo state
    const [_profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState<
      string | null
    >(initialData?.profile_image_url || null);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null); // Cloudinary URL
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(
      null
    );
    const [isCropperOpen, setIsCropperOpen] = useState(false);

    // Cloudinary upload hook
    const {
      uploadProfilePhoto,
      isUploading,
      uploadProgress,
      error: uploadError,
      reset: resetUpload,
    } = useCloudinaryUpload();

    // Validation errors state
    const [errors, setErrors] = useState<FormValidationErrors>({});

    // Memoized form data to prevent infinite re-renders
    const formData = useMemo(
      (): DefaultMembershipFormData => ({
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        gender,
        marital_status: maritalStatus,
        phone,
        email,
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        city,
        state,
        postal_code: postalCode,
        country,
        membership_id: membershipId,
        membership_status: membershipStatus,
        membership_type: membershipType,
        date_joined: dateJoined,
        baptism_date: baptismDate,
        notes,
        profile_image_url: profilePhotoUrl || undefined, // Use Cloudinary URL instead of preview
        emergency_contact_name: emergencyContactName || undefined,
        emergency_contact_phone: emergencyContactPhone || undefined,
        emergency_contact_relationship:
          emergencyContactRelationship || undefined,
      }),
      [
        firstName,
        middleName,
        lastName,
        dateOfBirth,
        gender,
        maritalStatus,
        phone,
        email,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        membershipId,
        membershipStatus,
        membershipType,
        dateJoined,
        baptismDate,
        notes,
        profilePhotoUrl, // Changed from profilePhotoPreview
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelationship,
      ]
    );

    // Helper function to get current form data
    const getFormData = useCallback((): DefaultMembershipFormData => formData, [
      formData,
    ]);

    // Helper function to validate form
    const validateForm = (): {
      isValid: boolean;
      errors: FormValidationErrors;
    } => {
      const newErrors: FormValidationErrors = {};

      // Required field validations
      if (!firstName.trim()) {
        newErrors.first_name = 'First name is required';
      }
      if (!lastName.trim()) {
        newErrors.last_name = 'Last name is required';
      }
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!phone.trim()) {
        newErrors.phone = 'Phone number is required';
      }
      if (!dateOfBirth) {
        newErrors.date_of_birth = 'Date of birth is required';
      }
      if (!gender) {
        newErrors.gender = 'Gender is required';
      }
      if (!maritalStatus) {
        newErrors.marital_status = 'Marital status is required';
      }
      if (!addressLine1.trim()) {
        newErrors.address_line_1 = 'Address is required';
      }
      if (!city.trim()) {
        newErrors.city = 'City is required';
      }
      if (!state.trim()) {
        newErrors.state = 'State/Region is required';
      }
      if (!country.trim()) {
        newErrors.country = 'Country is required';
      }
      if (!membershipStatus) {
        newErrors.membership_status = 'Membership status is required';
      }
      if (!membershipType.trim()) {
        newErrors.membership_type = 'Membership type is required';
      }

      if (baptismDate && !baptismDate) {
        newErrors.baptism_date = 'Baptism date is required when baptized';
      }

      // Emergency contact validation - if any field is filled, validate all
      const hasEmergencyContact =
        emergencyContactName.trim() ||
        emergencyContactPhone.trim() ||
        emergencyContactRelationship;

      if (hasEmergencyContact) {
        if (!emergencyContactName.trim()) {
          newErrors.emergency_contact_name =
            'Emergency contact name is required';
        }
        if (!emergencyContactPhone.trim()) {
          newErrors.emergency_contact_phone =
            'Emergency contact phone is required';
        } else if (
          !/^[\+]?[1-9][\d]{0,15}$/.test(
            emergencyContactPhone.replace(/[\s\-\(\)]/g, '')
          )
        ) {
          newErrors.emergency_contact_phone =
            'Please enter a valid phone number';
        }
        if (!emergencyContactRelationship) {
          newErrors.emergency_contact_relationship = 'Relationship is required';
        }
      }

      setErrors(newErrors);
      return {
        isValid: Object.keys(newErrors).length === 0,
        errors: newErrors,
      };
    };

    const clearFieldErrors = (
      fieldName: keyof DefaultMembershipFormData,
      value: string
    ) => {
      if (value.trim()) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [fieldName]: '',
        }));
      }
    };

    // Helper function to reset form
    const resetForm = () => {
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setDateOfBirth(undefined);
      setGender('');
      setMaritalStatus('');
      setPhone('');
      setEmail('');
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setState('');
      setPostalCode('');
      setCountry('');
      setMembershipStatus('active');
      setMembershipType('Regular');
      setDateJoined(undefined);
      setBaptismDate(undefined);
      setNotes('');
      setEmergencyContactName('');
      setEmergencyContactPhone('');
      setEmergencyContactRelationship('');
      setProfilePhoto(null);
      setProfilePhotoPreview(null);
      setProfilePhotoUrl(null); // Reset Cloudinary URL
      setErrors({});
      resetUpload(); // Reset upload state
    };

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      getFormData,
      validateForm,
      resetForm,
    }));

    // Create a debounced version of onFormDataChange with 1 second delay
    const { debouncedCallback: debouncedOnFormDataChange } = useDebounce(
      (data: DefaultMembershipFormData) => {
        onFormDataChange?.(data);
      },
      2000
    );

    // Notify parent of form data changes with debouncing
    React.useEffect(() => {
      debouncedOnFormDataChange(formData);
    }, [formData]);

    // Profile photo handlers
    const handleFileSelect = (file: File) => {
      setSelectedImageFile(file);
      setIsCropperOpen(true);
    };

    const handleCropComplete = async (croppedFile: File) => {
      setProfilePhoto(croppedFile);

      // Create preview URL for immediate display
      if (profilePhotoPreview) {
        URL.revokeObjectURL(profilePhotoPreview);
      }
      const previewUrl = URL.createObjectURL(croppedFile);
      setProfilePhotoPreview(previewUrl);

      setIsCropperOpen(false);
      setSelectedImageFile(null);

      // Clear any previous upload errors
      resetUpload();
      setErrors((prev) => ({ ...prev, profile_photo: undefined }));

      // Upload to Cloudinary
      try {
        const result = await uploadProfilePhoto(croppedFile, 5); // 5MB max size
        setProfilePhotoUrl(result.url);
      } catch (error) {
        console.error('Profile photo upload failed:', error);
        setErrors((prev) => ({
          ...prev,
          profile_photo:
            error instanceof Error
              ? error.message
              : 'Failed to upload profile photo',
        }));
      }
    };

    const handleRemovePhoto = () => {
      if (profilePhotoPreview) {
        URL.revokeObjectURL(profilePhotoPreview);
      }
      setProfilePhoto(null);
      setProfilePhotoPreview(null);
      setProfilePhotoUrl(null); // Clear Cloudinary URL
      resetUpload(); // Reset upload state
      setErrors((prev) => ({ ...prev, profile_photo: undefined }));
    };

    // Cleanup preview URL on unmount
    React.useEffect(() => {
      return () => {
        if (profilePhotoPreview) {
          URL.revokeObjectURL(profilePhotoPreview);
        }
      };
    }, []);

    return (
      <div className={`space-y-8 ${className}`}>
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Membership Registration Form
          </h2>
        </div>

        {/* Profile Photo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-2 space-y-4">
              {/* Photo Preview */}
              <div className="relative w-fit">
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center overflow-hidden">
                  {profilePhotoPreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={profilePhotoPreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {/* Upload progress overlay */}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                          <div className="text-center text-white">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-1" />
                            <p className="text-xs">{uploadProgress}%</p>
                          </div>
                        </div>
                      )}
                      {/* Success indicator */}
                      {profilePhotoUrl && !isUploading && (
                        <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1">
                          <Upload className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No photo</p>
                    </div>
                  )}
                </div>

                {profilePhotoPreview && !isPreviewMode && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={handleRemovePhoto}
                    disabled={isUploading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Upload Section */}
              {!isPreviewMode && (
                <div className="w-full md:max-w-[300px] space-y-2">
                  <ModernFileUpload
                    onFileSelect={handleFileSelect}
                    accept="image/*"
                    maxSize={5}
                    variant="compact"
                    disabled={isPreviewMode || isUploading}
                  />

                  {/* Upload status messages */}
                  {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading... {uploadProgress}%</span>
                    </div>
                  )}

                  {profilePhotoUrl && !isUploading && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Upload className="w-4 h-4" />
                      <span>Photo uploaded successfully</span>
                    </div>
                  )}

                  {/* Error messages */}
                  {(uploadError || errors.profile_photo) && (
                    <p className="text-sm text-red-500">
                      {errors.profile_photo || uploadError?.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Full Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isPreviewMode}
                  className={`w-full ${
                    errors.first_name ? 'border-red-500' : ''
                  }`}
                  onBlur={(e) => clearFieldErrors('first_name', e.target.value)}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-500">{errors.first_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName" className="text-sm font-medium">
                  Middle Name
                </Label>
                <Input
                  id="middleName"
                  placeholder="Enter middle name"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  disabled={isPreviewMode}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isPreviewMode}
                  className={`w-full ${
                    errors.last_name ? 'border-red-500' : ''
                  }`}
                  onBlur={(e) => clearFieldErrors('last_name', e.target.value)}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-500">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 flex-wrap">
              {/* Date of Birth */}
              <div className="flex-1 space-y-2 border border-dashed py-2 px-4">
                <DateOfBirthPicker
                  value={
                    dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : ''
                  }
                  onChange={(dateString) => {
                    if (dateString) {
                      const date = new Date(dateString);
                      setDateOfBirth(date);
                      clearFieldErrors('date_of_birth', dateString);
                    } else {
                      setDateOfBirth(undefined);
                    }
                  }}
                  label="Date of Birth *"
                  placeholder="Select date of birth"
                  className={`w-full md:w-auto ${
                    errors.date_of_birth ? 'border-red-500' : ''
                  }`}
                  disabled={isPreviewMode}
                />
                {errors.date_of_birth && (
                  <p className="text-sm text-red-500">{errors.date_of_birth}</p>
                )}
              </div>

              {/* Gender */}
              <div className="flex-1 space-y-3 border border-dashed py-2 px-4">
                <Label className="text-sm font-medium">
                  Gender <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={gender}
                  onValueChange={(value) => {
                    setGender(value);
                    clearFieldErrors('gender', value);
                  }}
                  disabled={isPreviewMode}
                  className="flex flex-wrap gap-3"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                </RadioGroup>
                {errors.gender && (
                  <p className="text-sm text-red-500">{errors.gender}</p>
                )}
              </div>

              {/* Marital Status */}
              <div className="flex-1 space-y-2 border border-dashed py-2 px-4">
                <Label className="text-sm font-medium">
                  Marital Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={maritalStatus}
                  onValueChange={(value) => {
                    setMaritalStatus(value);
                    clearFieldErrors('marital_status', value);
                  }}
                  disabled={isPreviewMode}
                >
                  <SelectTrigger
                    className={`w-full ${
                      errors.marital_status ? 'border-red-500' : ''
                    }`}
                  >
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
                {errors.marital_status && (
                  <p className="text-sm text-red-500">
                    {errors.marital_status}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Phone and Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isPreviewMode}
                  className={`w-full ${errors.phone ? 'border-red-500' : ''}`}
                  onBlur={() => clearFieldErrors('phone', phone)}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPreviewMode}
                  className={`w-full ${errors.email ? 'border-red-500' : ''}`}
                  onBlur={() => clearFieldErrors('email', email)}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1" className="text-sm font-medium">
                    Address Line 1 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="addressLine1"
                    placeholder="Enter street address"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    disabled={isPreviewMode}
                    className={`w-full ${
                      errors.address_line_1 ? 'border-red-500' : ''
                    }`}
                    onBlur={() =>
                      clearFieldErrors('address_line_1', addressLine1)
                    }
                  />
                  {errors.address_line_1 && (
                    <p className="text-sm text-red-500">
                      {errors.address_line_1}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2" className="text-sm font-medium">
                    Address Line 2
                  </Label>
                  <Input
                    id="addressLine2"
                    placeholder="Apartment, suite, etc. (optional)"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    disabled={isPreviewMode}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={isPreviewMode}
                    className={`w-full ${errors.city ? 'border-red-500' : ''}`}
                    onBlur={() => clearFieldErrors('city', city)}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500">{errors.city}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    State/Region <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    placeholder="Enter state/region"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    disabled={isPreviewMode}
                    className={`w-full ${errors.state ? 'border-red-500' : ''}`}
                    onBlur={() => clearFieldErrors('state', state)}
                  />
                  {errors.state && (
                    <p className="text-sm text-red-500">{errors.state}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-sm font-medium">
                    Postal Code
                  </Label>
                  <Input
                    id="postalCode"
                    placeholder="Enter postal code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    disabled={isPreviewMode}
                    className={`w-full ${
                      errors.postal_code ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.postal_code && (
                    <p className="text-sm text-red-500">{errors.postal_code}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="country"
                    placeholder="Enter country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    disabled={isPreviewMode}
                    className={`w-full ${
                      errors.country ? 'border-red-500' : ''
                    }`}
                    onBlur={() => clearFieldErrors('country', country)}
                  />
                  {errors.country && (
                    <p className="text-sm text-red-500">{errors.country}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Membership Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Membership Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Membership ID and Date Joined */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="membershipId" className="text-sm font-medium">
                  Membership ID
                </Label>
                <Input
                  id="membershipId"
                  value={membershipId}
                  disabled
                  className="w-full bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-generated membership ID
                </p>
              </div>
              <div className="space-y-2">
                <DatePicker
                  label="Date Joined"
                  value={
                    dateJoined ? dateJoined.toISOString().split('T')[0] : ''
                  }
                  onChange={(dateString) => {
                    if (dateString) {
                      const date = new Date(dateString);
                      setDateJoined(date);
                      clearFieldErrors('date_joined', dateString);
                    } else {
                      setDateJoined(undefined);
                    }
                  }}
                  disabled={isPreviewMode}
                  className={`w-full ${
                    errors.date_joined ? 'border-red-500' : ''
                  }`}
                  captionLayout="dropdown"
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                  disableFuture={true}
                  placeholder="Select join date"
                />
                {errors.date_joined && (
                  <p className="text-sm text-red-500">{errors.date_joined}</p>
                )}
              </div>
            </div>

            {/* Membership Status and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="membershipStatus"
                  className="text-sm font-medium"
                >
                  Membership Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={membershipStatus}
                  onValueChange={(value: MembershipStatus) => {
                    setMembershipStatus(value);
                    clearFieldErrors('membership_status', value);
                  }}
                  disabled={isPreviewMode}
                >
                  <SelectTrigger
                    className={`w-full ${
                      errors.membership_status ? 'border-red-500' : ''
                    }`}
                  >
                    <SelectValue placeholder="Select membership status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                    <SelectItem value="deceased">Deceased</SelectItem>
                  </SelectContent>
                </Select>
                {errors.membership_status && (
                  <p className="text-sm text-red-500">
                    {errors.membership_status}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="membershipType" className="text-sm font-medium">
                  Membership Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={membershipType}
                  onValueChange={(value: MembershipType) => {
                    setMembershipType(value);
                    clearFieldErrors('membership_type', value);
                  }}
                  disabled={isPreviewMode}
                >
                  <SelectTrigger
                    className={`w-full ${
                      errors.membership_type ? 'border-red-500' : ''
                    }`}
                  >
                    <SelectValue placeholder="Select membership type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Associate">Associate</SelectItem>
                    <SelectItem value="New Convert">New Convert</SelectItem>
                    <SelectItem value="Visitor">Visitor</SelectItem>
                  </SelectContent>
                </Select>
                {errors.membership_type && (
                  <p className="text-sm text-red-500">
                    {errors.membership_type}
                  </p>
                )}
              </div>
            </div>

            {/* Baptism Date */}
            <div className="space-y-2">
              <DatePicker
                label="Baptism Date (Optional)"
                value={
                  baptismDate ? baptismDate.toISOString().split('T')[0] : ''
                }
                onChange={(dateString) => {
                  if (dateString) {
                    const date = new Date(dateString);
                    setBaptismDate(date);
                    clearFieldErrors('baptism_date', dateString);
                  } else {
                    setBaptismDate(undefined);
                  }
                }}
                disabled={isPreviewMode}
                className={`w-full md:w-auto ${
                  errors.baptism_date ? 'border-red-500' : ''
                }`}
                captionLayout="dropdown"
                fromYear={1900}
                toYear={new Date().getFullYear()}
                disableFuture={true}
                placeholder="Select baptism date"
              />
              {errors.baptism_date && (
                <p className="text-sm text-red-500">{errors.baptism_date}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about the member..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPreviewMode}
                className="w-full min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Emergency Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Emergency Contact Name and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="emergencyContactName"
                  className="text-sm font-medium"
                >
                  Emergency Contact Name
                </Label>
                <Input
                  id="emergencyContactName"
                  placeholder="Enter emergency contact name"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  disabled={isPreviewMode}
                  className={`w-full ${
                    errors.emergency_contact_name ? 'border-red-500' : ''
                  }`}
                />
                {errors.emergency_contact_name && (
                  <p className="text-sm text-red-500">
                    {errors.emergency_contact_name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="emergencyContactPhone"
                  className="text-sm font-medium"
                >
                  Emergency Contact Phone
                </Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  placeholder="Enter emergency contact phone"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  disabled={isPreviewMode}
                  className={`w-full ${
                    errors.emergency_contact_phone ? 'border-red-500' : ''
                  }`}
                />
                {errors.emergency_contact_phone && (
                  <p className="text-sm text-red-500">
                    {errors.emergency_contact_phone}
                  </p>
                )}
              </div>
            </div>

            {/* Emergency Contact Relationship */}
            <div className="space-y-2">
              <Label
                htmlFor="emergencyContactRelationship"
                className="text-sm font-medium"
              >
                Relationship to Member
              </Label>
              <Select
                value={emergencyContactRelationship}
                onValueChange={(value) =>
                  setEmergencyContactRelationship(value)
                }
                disabled={isPreviewMode}
              >
                <SelectTrigger
                  className={`w-full md:w-auto ${
                    errors.emergency_contact_relationship
                      ? 'border-red-500'
                      : ''
                  }`}
                >
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="relative">Relative</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.emergency_contact_relationship && (
                <p className="text-sm text-red-500">
                  {errors.emergency_contact_relationship}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Photo Cropper Modal */}
        <ProfilePhotoCropper
          isOpen={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false);
            setSelectedImageFile(null);
          }}
          onCropComplete={handleCropComplete}
          imageFile={selectedImageFile}
        />
      </div>
    );
  }
);
