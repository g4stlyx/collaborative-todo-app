import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  updateProfile, 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  deleteUser 
} from 'firebase/auth';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import '../../style/Profile.css';

interface UserProfile {
  name: string;
  email: string;
  bio?: string;
  phoneNumber?: string;
  photoURL?: string;
}

export const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // Profile picture state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  const fetchProfile = async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        setProfile(userData);
        setName(userData.name);
        setBio(userData.bio || '');
        setPhoneNumber(userData.phoneNumber || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setUploadingPhoto(true);
      setError('');

      // Upload to Firebase Storage
      const storage = getStorage();
      const photoRef = ref(storage, `profile-photos/${currentUser.uid}`);
      await uploadBytes(photoRef, file);
      const photoURL = await getDownloadURL(photoRef);

      // Update Auth Profile
      await updateProfile(currentUser, { photoURL });

      // Update Firestore Profile
      await updateDoc(doc(db, 'users', currentUser.uid), { photoURL });

      await fetchProfile();
      setSuccess('Profile photo updated successfully!');
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (newPassword !== confirmPassword) {
      return setError('New passwords do not match');
    }

    try {
      setError('');
      setSuccess('');

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      setSuccess('Password updated successfully!');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Failed to change password. Please check your current password.');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setError('');

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email!,
        deletePassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Delete profile photo if exists
      if (profile?.photoURL) {
        const storage = getStorage();
        const photoRef = ref(storage, `profile-photos/${currentUser.uid}`);
        await deleteObject(photoRef);
      }

      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid));

      // Delete user account
      await deleteUser(currentUser);

      navigate('/login');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please check your password.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setError('');
      setSuccess('');
      
      // Update Firestore profile
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name,
        bio,
        phoneNumber,
        updatedAt: new Date()
      });

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: name
      });

      setProfile(prev => ({
        ...prev!,
        name,
        bio,
        phoneNumber
      }));

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  if (loading) {
    return <div className="profile-container">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Profile Picture Section */}
      <div className="profile-picture-section">
        <div className="profile-picture">
          <img 
            src={profile?.photoURL || 'assets/default-avatar.png'} 
            alt="Profile" 
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingPhoto}
          className="upload-photo-btn"
        >
          {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={currentUser?.email || ''}
              disabled
              className="disabled-input"
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="profile-actions">
            <button type="submit" className="save-btn">Save Changes</button>
            <button 
              type="button" 
              onClick={() => setIsEditing(false)}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-info">
          <div className="info-group">
            <strong>Name:</strong>
            <span>{profile?.name}</span>
          </div>
          
          <div className="info-group">
            <strong>Email:</strong>
            <span>{profile?.email}</span>
          </div>

          {profile?.bio && (
            <div className="info-group">
              <strong>Bio:</strong>
              <span>{profile.bio}</span>
            </div>
          )}

          {profile?.phoneNumber && (
            <div className="info-group">
              <strong>Phone:</strong>
              <span>{profile.phoneNumber}</span>
            </div>
          )}

          <button 
            onClick={() => setIsEditing(true)}
            className="edit-btn"
          >
            Edit Profile
          </button>
        </div>
      )}

      {/* Password Change Form */}
      <div className="password-section">
        <button 
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="toggle-password-btn"
        >
          {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
        </button>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="password-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="change-password-btn">
              Update Password
            </button>
          </form>
        )}
      </div>

      {/* Account Deletion Section */}
      <div className="delete-account-section">
        <button 
          onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
          className="delete-account-btn"
        >
          Delete Account
        </button>

        {showDeleteConfirm && (
          <form onSubmit={handleDeleteAccount} className="delete-account-form">
            <p className="warning-text">
              This action cannot be undone. Please enter your password to confirm.
            </p>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
              />
            </div>
            <div className="delete-actions">
              <button type="submit" className="confirm-delete-btn">
                Confirm Delete
              </button>
              <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(false)}
                className="cancel-delete-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}; 