
import requests
import json
import base64

API_URL = "http://localhost:8000"

def login():
    try:
        # Try both endpoints commonly used in fastapi (oauth2 or custom json)
        res = requests.post(f"{API_URL}/api/auth/token", data={
            "username": "doctor@bprc.id",
            "password": "Doctor123!"
        })
        if res.status_code == 200:
            return res.json()["access_token"]
        
        # Fallback to json endpoint if exists
        res = requests.post(f"{API_URL}/api/auth/login", json={
            "email": "doctor@bprc.id",
            "password": "Doctor123!"
        })
        if res.status_code == 200:
            return res.json()["access_token"]
            
        print("Login failed:", res.text)
        return None
    except Exception as e:
        print("Login error:", e)
        return None

def main():
    token = login()
    if not token:
        print("Failed to login. Is backend running?")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Get an encounter (or list them)
    # Assuming there's at least one encounter or patient
    # Let's try to get patient list first, then encounter list
    try:
        res = requests.get(f"{API_URL}/api/patients?skip=0&limit=1", headers=headers)
        patients = res.json()
        if not patients:
            print("No patients found. Need to create one? (Skipping for now)")
            return
        
        patient_id = patients[0]["id"]
        
        # Get encounters for this patient
        res = requests.get(f"{API_URL}/api/encounters?patient_id={patient_id}", headers=headers)
        encounters = res.json()
        
        if not encounters:
            print("No encounters found. Creating one...")
            res = requests.post(f"{API_URL}/api/encounters", json={
                "patient_id": patient_id,
                "payment_type": "umum"
            }, headers=headers)
            encounters = [res.json()]
            
        enc_id = encounters[0]["id"]
        print(f"Using Encounter ID: {enc_id}")
        
        # 2. Update Nursing (using the payload structure we defined in schemas)
        print("Testing Nursing Save...")
        nursing_payload = {
            "chief_complaint_nurse": "TEST NURSING COMPLAINT 123",
            "allergy_status": "Ada",
            "allergy_details": "Peanuts",
            "vitals_hr": 80,
            "vitals_rr": 18,
            "vitals_bp_systolic": 120,
            "vitals_bp_diastolic": 80,
            "vitals_temp_c": 36.5,
            "adl_status": "Mandiri",
            "unintentional_weight_loss_6mo": "tidak",
            "reduced_appetite": "tidak",
            "pain_scale_type": "NRS",
            "pain_score": 5,
            "pain_location": "Head",
            "pain_pattern": "menetap",
            "fallrisk_a_imbalance": False,
            "fallrisk_b_support_hold": False
        }
        res = requests.put(f"{API_URL}/api/encounters/{enc_id}/nursing", json=nursing_payload, headers=headers)
        print("Nursing Save Response:", res.status_code, res.text)
        
        if res.status_code != 200:
            return

        # 3. Generate PDF
        print("Testing PDF Generation...")
        res = requests.post(f"{API_URL}/api/encounters/{enc_id}/pdf?lang=en", headers=headers)
        print("PDF Response:", res.status_code)
        
        if res.status_code == 200:
            data = res.json()
            b64 = data.get("bytes_b64", "")
            if len(b64) > 1000:
                print("PDF Generated successfully (size > 1KB)")
                
                # Verify content (primitive check: save to file)
                # with open("debug_output.pdf", "wb") as f:
                #     f.write(base64.b64decode(b64))
            else:
                print("PDF generated but seems empty/too small")
        else:
            print("PDF failed:", res.text)

    except Exception as e:
        print("Error during test:", e)

if __name__ == "__main__":
    main()
