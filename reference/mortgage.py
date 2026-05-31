class HomeLoan:
    def __init__(self, interest_rate, purchase_price, down_payment, loan_length, real_estate_tax_rate, future_value=0):
        self.interest_rate = interest_rate
        self.purchase_price = purchase_price
        self.downpayment = down_payment
        self.loan_length = loan_length  # in years
        self.real_estate_tax_rate = real_estate_tax_rate
        self.future_value = future_value
        self.loan_amount = self.purchase_price*(1-(self.downpayment/100))

    def monthly_payment(self):
        # Monthly interest rate
        monthly_rate = self.interest_rate / 12 / 100

        # Number of payments
        num_payments = self.loan_length * 12

        # Monthly payment calculation
        if monthly_rate > 0:
            monthlypayment = (self.loan_amount * monthly_rate) / (1 - (1 + monthly_rate) ** -num_payments)
        else:
            monthlypayment = self.loan_amount / num_payments
        return monthlypayment
    
    # Generate payment schedule
    def payment_schedule(self, pmipayment):

        monthly_rate = self.interest_rate / 12 / 100
        remaining_balance = self.loan_amount
        initialloanvalue = self.loan_amount
        schedule = []

        # Loop through each month of the loan term
        for i in range(1, self.loan_length * 12 + 1):

            interest_payment = remaining_balance * monthly_rate
            principal_payment = self.monthly_payment() - interest_payment
            remaining_balance -= principal_payment
            
            # Add PMI payment if applicable
            if remaining_balance < 0.8*initialloanvalue:
                schedule.append({
                    'Month': i,
                    'Interest Payment': interest_payment,
                    'Principal Payment': principal_payment,
                    'PMI': 0.00, # PMI removed once below 80% LTV
                    'Remaining Balance': remaining_balance
                })
            else:
                schedule.append({
                    'Month': i,
                    'Interest Payment': interest_payment,
                    'Principal Payment': principal_payment,
                    'PMI': pmipayment,
                    'Remaining Balance': remaining_balance
                })
        
        return schedule
        

class RealEstateTaxes:
    def __init__(self, real_estate_tax_rate, purchase_price=None, assessed_homevalue=None):
        self.real_estate_tax_rate = real_estate_tax_rate/100
        self.purchase_price = purchase_price
        self.assessed_homevalue = assessed_homevalue

    def annualtaxes(self):
        #annual taxes owed based on purchase price if assessed value is not given
        if self.assessed_homevalue is not None:
            taxes = self.real_estate_tax_rate*self.assessed_homevalue
        elif self.purchase_price is not None:
            taxes = self.real_estate_tax_rate*self.purchase_price
        else:
            raise ValueError("Both assessed_homevalue and purchase_price are missing")
        
        return taxes

class PrivateMortgageInsurance:
    def __init__(self, pmi_rate, loan_amount, loan_length):
        self.pmi_rate = pmi_rate
        self.loan_amount = loan_amount
        self.loan_length = loan_length

    # Calculate PMI monthly payment
    def pmimonthlypayment(self):
        pmi_monthly_payment = ((self.pmi_rate/100)*self.loan_amount)/12
        return pmi_monthly_payment


class Mortgage:
    def __init__(self,interest_rate, purchase_price, down_payment, 
                loan_length, real_estate_rax_rate, private_mortgage_insurance_rate, 
                homeowner_insurance, hoa_fee, assessed_value):
        
        # Initialize default values
        self.taxes = 0
        self.pmi_payment = 0

        # Initalize input parameters
        self.interest_rate = interest_rate
        self.purchase_price = purchase_price
        self.down_payment = down_payment
        self.loan_length = loan_length
        self.real_estate_tax_rate = real_estate_rax_rate
        self.private_mortgage_insurance_rate = private_mortgage_insurance_rate
        self.assessed_value = assessed_value
        self.hoa = hoa_fee
        self.insurance = homeowner_insurance / 12

    # Calculate mortgage payment, amotorization and loan   
    def mortgagepayment(self):
        
        loan = HomeLoan(self.interest_rate, self.purchase_price, self.down_payment, self.loan_length, self.real_estate_tax_rate)

        # Check if user enter assessed value or market value (purchase price)    
        if self.assessed_value == 0:
            realestatetaxes = RealEstateTaxes(self.real_estate_tax_rate, self.purchase_price)
            self.taxes = realestatetaxes.annualtaxes()
        else:
            realestatetaxes = RealEstateTaxes(self.real_estate_tax_rate, self.assessed_value)
            self.taxes = realestatetaxes.annualtaxes()
       
         # Putting less than 20% down, have user include estimated pmi rate for calculations
        if self.private_mortgage_insurance_rate > 0:

            # Determine PMI monthly payment
            pmi = PrivateMortgageInsurance(self.private_mortgage_insurance_rate, loan.loan_amount, self.loan_length)
            self.pmi_payment = pmi.pmimonthlypayment()

            # Calculate monthly mortgage payment and amamtorization
            mortgage = loan.monthly_payment() + self.taxes/12 + self.pmi_payment + self.insurance + self.hoa
            amatorization = loan.payment_schedule(self.pmi_payment)

        else:
            # Calculate monthly mortgage payment and amamtorization
            mortgage = loan.monthly_payment() + self.taxes/12 + self.insurance + self.hoa
            amatorization = loan.payment_schedule(self.pmi_payment)
        

        return mortgage, amatorization, loan
    
