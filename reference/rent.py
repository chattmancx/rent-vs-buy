class Renter:
    def __init__ (self, base_rent, pet_rent, parking_fee, renters_insurance, admin_fee, security_deposit, pet_deposit):
        
        self.base_rent = base_rent
        self.pet_rent = pet_rent
        self.parking_fee = parking_fee
        self.renters_insurance = renters_insurance
        self.admin_fee = admin_fee
        self.security_deposit = security_deposit
        self.pet_deposit = pet_deposit

    # Calculate monthly rent payment and upfront costs
    def rentpayment(self):
        
        upfront_costs = self.admin_fee + self.security_deposit + self.pet_deposit
        rent_payment = self.base_rent + self.pet_rent + self.parking_fee + self.renters_insurance

        return rent_payment, upfront_costs