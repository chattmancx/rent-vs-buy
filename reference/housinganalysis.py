class HousingAnalysis:
    def __init__(self, mortgage, loan, closingcosts, maintenance, homevalueincrease, 
                 hoaincrease, maintenanceincrease, renter, rent_payment, upfront_costs, 
                 rent_increase, utilities, ultilitiesincrease, insuranceincrease):
        
        # Home Owner Parameters
        self.mortgage = mortgage
        self.loan = loan
        self.closingcosts = closingcosts
        self.maintenance = maintenance
        self.appreciation = homevalueincrease
        self.hoaincrease = hoaincrease
        self.maintenanceincrease = maintenanceincrease
       
        # Renter paramters
        self.renter = renter
        self.rent_payment = rent_payment
        self.upfront_costs = upfront_costs
        self.rent_increase = rent_increase

        # Universal parameters
        self.utilities = utilities
        self.utilitiesincrease = ultilitiesincrease
        self.insuranceincrease = insuranceincrease

    # Calculate increasing costs
    def increases(self, rateofincrease, initalvalue):
        self.rateofincrease = rateofincrease
        self.initalvalue = initalvalue

        newvalue = initalvalue*(1 + rateofincrease)

        return newvalue

    # Monthly increasing ownership costs
    def ownership_phantomcosts(self):
        
        # List for rising costs over the payment period
        ownership_phantomcosts = []

        # Amount paid YTD
        taxespaid = self.mortgage.taxes/12
        hoaduespaid = self.mortgage.hoa
        insurancepaid = self.mortgage.insurance
        homevalue = self.loan.purchase_price
        homemaintenance = self.maintenance
        utilities = self.utilities

        # Loop through each year and month to calculate increasing costs
        for i in range(1, self.loan.loan_length + 1):

            for j in range(1, 12 + 1):
                ownership_phantomcosts.append({
                    'Real Estate Taxes': taxespaid,
                    'HOA Dues': hoaduespaid,
                    'Home Insurance': insurancepaid,
                    'Home Appreciation': homevalue,
                    'Home Maintenance': homemaintenance,
                    'Utilities': utilities
                })

            taxespaid = self.increases(self.appreciation, taxespaid)
            hoaduespaid = self.increases(self.hoaincrease, hoaduespaid)
            insurancepaid = self.increases(self.insuranceincrease, insurancepaid)
            homevalue = self.increases(self.appreciation, homevalue)
            homemaintenance = self.increases(self.maintenanceincrease, homemaintenance)
            utilities = self.increases(self.utilitiesincrease, utilities)

        return ownership_phantomcosts
    
    # Monthly increasing rental costs
    def rental_phantomcosts(self, ):
        
        # List for rising costs over the payment period
        rental_phantomcosts = []

        # Amount paid YTD
        base_rent = self.renter.base_rent
        renters_insurance = self.renter.renters_insurance
        pet_rent = self.renter.pet_rent
        parking_fee = self.renter.parking_fee

        # Loop through each year and month to calculate increasing costs
        for i in range(1, self.loan.loan_length + 1):

            for j in range(1, 12 + 1):
                rental_phantomcosts.append({
                    'Base Rent': base_rent,
                    'Pet Rent': pet_rent,
                    'Parking Fee': parking_fee,
                    'Renters Insurance': renters_insurance,
                })

            base_rent = self.increases(self.rent_increase, base_rent)
            renters_insurance = self.increases(self.insuranceincrease, renters_insurance)
            pet_rent = self.increases(self.hoaincrease, pet_rent)
            parking_fee = self.increases(self.hoaincrease, parking_fee)


        return rental_phantomcosts

    # Housing Statistics
    def totalcostofownership(self, schedule): 
        
        total_costs_of_ownership_and_rentership = []
        
        # Calculate totals from schedule
        total_principal = sum(payment['Principal Payment'] for payment in schedule)
        total_interest = sum(payment['Interest Payment'] for payment in schedule)
        total_pmi = sum(payment['PMI'] for payment in schedule)
        total_realestatetaxes = sum(increase['Real Estate Taxes'] for increase in schedule )
        total_hoaduespaid = sum(increase['HOA Dues'] for increase in schedule )
        total_insurancepaid = sum(increase['Home Insurance'] for increase in schedule )
        total_maintenance = sum(increase['Home Maintenance'] for increase in schedule )
        total_utilities = sum(increase['Utilities'] for increase in schedule )
        total_rent_paid = sum(payment['Base Rent'] for payment in schedule)
        total_renters_insurance_paid = sum(payment['Renters Insurance'] for payment in schedule)
        total_pet_rent_paid = sum(payment['Pet Rent'] for payment in schedule)
        total_parking_fees_paid = sum(payment['Parking Fee'] for payment in schedule)

        # Calculate total costs
        totalcostofownership = sum((total_principal, total_interest, total_pmi,
                                    total_realestatetaxes, total_hoaduespaid, total_insurancepaid,
                                    total_utilities))
        totalcostofrentership = sum((total_rent_paid, total_renters_insurance_paid, total_pet_rent_paid,
                                    total_parking_fees_paid, total_utilities))

        # Append results to list
        total_costs_of_ownership_and_rentership.append({
            'Total Principal': total_principal,
            'Total Interest': total_interest,
            'Total PMI': total_pmi,
            'Total Real Estate Taxes': total_realestatetaxes,
            'Total HOA Dues': total_hoaduespaid,
            'Total Insurance': total_insurancepaid,
            'Total Home Maintenance': total_maintenance,
            'Total Utilities': total_utilities,
            'Total Cost of Home Ownership': totalcostofownership,
            'Total Equity in the Home': schedule[-1]['Home Appreciation'],
            'Total Rent': total_rent_paid,
            'Total Renters Insurance': total_renters_insurance_paid,
            'Total Pet Fees': total_pet_rent_paid,
            'Total Parking Fees': total_parking_fees_paid,
            'Total Cost of Rentership': totalcostofrentership
        })

        return total_costs_of_ownership_and_rentership